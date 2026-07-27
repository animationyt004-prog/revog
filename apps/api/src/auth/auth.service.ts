import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'crypto';
import { MailerService } from '../common/mailer/mailer.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { SmsService } from '../common/sms/sms.service';

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RATE_LIMIT = 5; // requests per window
const OTP_RATE_WINDOW_S = 60;

/** Login accepts either an email address or an Indian mobile number; the
 *  channel that carries the code follows from which one was typed. */
export type Identifier =
  { kind: 'email'; value: string } | { kind: 'phone'; value: string };

/** Anything with an "@" is treated as an email; everything else has to look
 *  like a 10-digit Indian mobile once punctuation and +91 are stripped. */
export function parseIdentifier(raw: string): Identifier | null {
  const trimmed = raw.trim();
  if (trimmed.includes('@')) {
    const email = trimmed.toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? { kind: 'email', value: email }
      : null;
  }
  const phone = SmsService.normalizePhone(trimmed);
  return SmsService.isValidPhone(phone)
    ? { kind: 'phone', value: phone }
    : null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string; // raw value — goes into the httpOnly cookie only
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    name: string | null;
    role: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly isProd: boolean;
  private readonly refreshTtlDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mailer: MailerService,
    private readonly sms: SmsService,
  ) {
    this.isProd = config.get('NODE_ENV') === 'production';
    this.refreshTtlDays = Number(
      config.get('JWT_REFRESH_TTL', '30d').replace(/\D/g, '') || 30,
    );
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  // ---------------------------------------------------------------- OTP

  /** Channels the login form can actually deliver on. In dev both stay open
   *  so the flow is testable with codes logged to the console. */
  availableChannels(): { email: boolean; sms: boolean } {
    if (!this.isProd) return { email: true, sms: true };
    return { email: this.mailer.configured, sms: this.sms.configured };
  }

  async requestOtp(id: Identifier, ip: string): Promise<void> {
    const identifier = id.value;
    const [idOk, ipOk] = await Promise.all([
      this.redis.rateLimit(
        `otp:rl:id:${identifier}`,
        OTP_RATE_LIMIT,
        OTP_RATE_WINDOW_S,
      ),
      this.redis.rateLimit(
        `otp:rl:ip:${ip}`,
        OTP_RATE_LIMIT * 3,
        OTP_RATE_WINDOW_S,
      ),
    ]);
    if (!idOk || !ipOk) {
      throw new HttpException(
        'Too many OTP requests. Try again in a minute.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = String(randomInt(100000, 1000000)); // 6 digits

    // A fresh OTP invalidates any previous pending ones for this identifier.
    await this.prisma.otpCode.deleteMany({
      where: { identifier, consumedAt: null },
    });
    await this.prisma.otpCode.create({
      data: {
        identifier,
        codeHash: this.hash(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
      },
    });

    // Whichever channel is configured does the sending. Failures are generic
    // so we never leak whether an account exists.
    const channel = id.kind === 'phone' ? this.sms : this.mailer;
    if (!channel.configured) {
      // In dev the code is logged so the flow stays testable without an inbox
      // or an SMS balance. In production that would be a trap: the caller is
      // told "code sent" while it only ever reached the server log.
      if (this.isProd) {
        throw new HttpException(
          id.kind === 'phone'
            ? 'Login by mobile is unavailable right now. Please use your email address.'
            : 'Login by email is unavailable right now. Please try again later.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      this.logger.log(`DEV OTP for ${identifier}: ${code}`);
      return;
    }
    try {
      if (id.kind === 'phone') await this.sms.sendOtp(identifier, code);
      else await this.mailer.sendOtp(identifier, code);
    } catch {
      this.logger.error(`Failed to send OTP to ${identifier} via ${id.kind}`);
      throw new Error('Could not send the login code. Please try again.');
    }
  }

  async verifyOtp(
    id: Identifier,
    code: string,
    meta: { ip?: string; userAgent?: string },
  ): Promise<AuthTokens> {
    const identifier = id.value;
    const otp = await this.prisma.otpCode.findFirst({
      where: { identifier, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp || otp.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'OTP expired or not found. Request a new one.',
      );
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new UnauthorizedException(
        'Too many wrong attempts. Request a new OTP.',
      );
    }

    const expected = Buffer.from(otp.codeHash, 'hex');
    const actual = Buffer.from(this.hash(code), 'hex');
    if (
      expected.length !== actual.length ||
      !timingSafeEqual(expected, actual)
    ) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Incorrect OTP.');
    }

    const [, user] = await this.prisma.$transaction([
      this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { consumedAt: new Date() },
      }),
      id.kind === 'email'
        ? this.prisma.user.upsert({
            where: { email: identifier },
            create: { email: identifier, emailVerified: true },
            update: { emailVerified: true },
          })
        : this.prisma.user.upsert({
            where: { phone: identifier },
            create: { phone: identifier },
            update: {},
          }),
    ]);

    // Claim past guest orders so they appear in the account and unlock
    // reviews/returns. Email logins match on the order's email; SMS logins
    // match the delivery phone, which is the only handle those buyers gave us.
    const claimed = await this.prisma.order.updateMany({
      where:
        id.kind === 'email'
          ? { email: identifier, userId: null }
          : { phone: identifier, userId: null },
      data: { userId: user.id },
    });
    if (claimed.count > 0) {
      this.logger.log(
        `Claimed ${claimed.count} guest order(s) for ${identifier}`,
      );
    }

    // New login = new token family.
    const family = randomBytes(16).toString('hex');
    return this.issueTokens(user, family, meta);
  }

  // ------------------------------------------------------- token issuing

  private async issueTokens(
    user: {
      id: string;
      email: string | null;
      phone: string | null;
      name: string | null;
      role: string;
    },
    family: string,
    meta: { ip?: string; userAgent?: string },
    replacesId?: string,
  ): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_TTL', '15m'),
      },
    );

    const refreshToken = randomBytes(48).toString('base64url');
    const created = await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hash(refreshToken),
        family,
        expiresAt: new Date(Date.now() + this.refreshTtlDays * 86_400_000),
        userAgent: meta.userAgent?.slice(0, 255),
        ip: meta.ip,
      },
    });
    if (replacesId) {
      await this.prisma.refreshToken.update({
        where: { id: replacesId },
        data: { revokedAt: new Date(), replacedById: created.id },
      });
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    };
  }

  // ------------------------------------------------------------ rotation

  async refresh(
    rawToken: string,
    meta: { ip?: string; userAgent?: string },
  ): Promise<AuthTokens> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(rawToken) },
      include: { user: true },
    });
    if (!stored) throw new UnauthorizedException('Invalid refresh token.');

    // Reuse of a rotated/revoked token = possible theft. Kill the family.
    if (stored.revokedAt || stored.replacedById) {
      await this.prisma.refreshToken.updateMany({
        where: { family: stored.family, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      this.logger.warn(
        `Refresh token reuse detected — family ${stored.family} revoked`,
      );
      throw new ForbiddenException('Session invalidated. Please log in again.');
    }
    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired. Please log in again.');
    }

    return this.issueTokens(stored.user, stored.family, meta, stored.id);
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(rawToken) },
    });
    if (stored) {
      await this.prisma.refreshToken.updateMany({
        where: { family: stored.family, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
