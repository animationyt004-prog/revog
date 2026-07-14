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
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RATE_LIMIT = 5; // requests per window
const OTP_RATE_WINDOW_S = 60;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string; // raw value — goes into the httpOnly cookie only
  user: { id: string; email: string; name: string | null; role: string };
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
  ) {
    this.isProd = config.get('NODE_ENV') === 'production';
    this.refreshTtlDays = Number(config.get('JWT_REFRESH_TTL', '30d').replace(/\D/g, '') || 30);
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  // ---------------------------------------------------------------- OTP

  async requestOtp(email: string, ip: string): Promise<void> {
    const [emailOk, ipOk] = await Promise.all([
      this.redis.rateLimit(`otp:rl:email:${email}`, OTP_RATE_LIMIT, OTP_RATE_WINDOW_S),
      this.redis.rateLimit(`otp:rl:ip:${ip}`, OTP_RATE_LIMIT * 3, OTP_RATE_WINDOW_S),
    ]);
    if (!emailOk || !ipOk) {
      throw new HttpException(
        'Too many OTP requests. Try again in a minute.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = String(randomInt(100000, 1000000)); // 6 digits

    // A fresh OTP invalidates any previous pending ones for this email.
    await this.prisma.otpCode.deleteMany({ where: { email, consumedAt: null } });
    await this.prisma.otpCode.create({
      data: {
        email,
        codeHash: this.hash(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
      },
    });

    if (this.isProd) {
      // Phase 1 follow-up: send via Resend once the account exists.
      this.logger.warn(`OTP email delivery not configured — OTP for ${email} not sent`);
    } else {
      // Dev mode: OTP goes to the server console instead of an inbox.
      this.logger.log(`DEV OTP for ${email}: ${code}`);
    }
  }

  async verifyOtp(email: string, code: string, meta: { ip?: string; userAgent?: string }): Promise<AuthTokens> {
    const otp = await this.prisma.otpCode.findFirst({
      where: { email, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp || otp.expiresAt < new Date()) {
      throw new UnauthorizedException('OTP expired or not found. Request a new one.');
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new UnauthorizedException('Too many wrong attempts. Request a new OTP.');
    }

    const expected = Buffer.from(otp.codeHash, 'hex');
    const actual = Buffer.from(this.hash(code), 'hex');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
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
      this.prisma.user.upsert({
        where: { email },
        create: { email, emailVerified: true },
        update: { emailVerified: true },
      }),
    ]);

    // Claim past guest orders placed with this (now verified) email so they
    // appear in the account and unlock reviews/returns.
    const claimed = await this.prisma.order.updateMany({
      where: { email, userId: null },
      data: { userId: user.id },
    });
    if (claimed.count > 0) {
      this.logger.log(`Claimed ${claimed.count} guest order(s) for ${email}`);
    }

    // New login = new token family.
    const family = randomBytes(16).toString('hex');
    return this.issueTokens(user, family, meta);
  }

  // ------------------------------------------------------- token issuing

  private async issueTokens(
    user: { id: string; email: string; name: string | null; role: string },
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
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  // ------------------------------------------------------------ rotation

  async refresh(rawToken: string, meta: { ip?: string; userAgent?: string }): Promise<AuthTokens> {
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
      this.logger.warn(`Refresh token reuse detected — family ${stored.family} revoked`);
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
