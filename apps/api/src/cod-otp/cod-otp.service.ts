import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../common/redis/redis.service';

const OTP_TTL_S = 600; // 10 minutes
const MAX_VERIFY_ATTEMPTS = 5;
const TOKEN_TTL = '20m';

/** COD phone verification via SMS OTP — cuts fake/RTO-prone COD orders.
 *  Dormant until an SMS provider key is configured; runs in a log-only test
 *  mode locally so the flow can be exercised without a real SMS. */
@Injectable()
export class CodOtpService {
  private readonly logger = new Logger(CodOtpService.name);
  private readonly apiKey: string;
  private readonly jwtSecret: string;

  constructor(
    config: ConfigService,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
  ) {
    this.apiKey = config.get<string>('FAST2SMS_API_KEY') ?? '';
    this.jwtSecret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  /** COD OTP only gates checkout when an SMS provider is configured. Set the
   *  key to "TEST" to enable the gate while logging OTPs instead of sending. */
  get enabled(): boolean {
    return this.apiKey.length > 0;
  }

  private get realSms(): boolean {
    return this.apiKey.length > 0 && this.apiKey !== 'TEST';
  }

  private static normalize(phone: string): string {
    return phone.replace(/\D/g, '').replace(/^91/, '').slice(-10);
  }

  async send(rawPhone: string, ip: string): Promise<{ sent: true; testMode: boolean }> {
    const phone = CodOtpService.normalize(rawPhone);
    if (!/^[6-9]\d{9}$/.test(phone)) {
      throw new BadRequestException('Enter a valid 10-digit mobile number.');
    }

    const okPhone = await this.redis.rateLimit(`codotp:rl:${phone}`, 5, 60);
    const okIp = await this.redis.rateLimit(`codotp:rl:ip:${ip}`, 15, 60);
    if (!okPhone || !okIp) {
      throw new BadRequestException('Too many OTP requests. Try again in a minute.');
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await this.redis.client.set(`codotp:code:${phone}`, code, 'EX', OTP_TTL_S);
    await this.redis.client.del(`codotp:att:${phone}`);

    if (this.realSms) {
      await this.sendSms(phone, code);
    } else {
      // Test mode (no key, or key="TEST"): log instead of sending.
      this.logger.warn(`[COD OTP TEST MODE] ${phone} -> ${code}`);
    }
    return { sent: true, testMode: !this.realSms };
  }

  /** Fast2SMS OTP route — provider owns the DLT-approved OTP template. */
  private async sendSms(phone: string, code: string): Promise<void> {
    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${this.apiKey}&route=otp&variables_values=${code}&numbers=${phone}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`SMS provider ${res.status}`);
    } catch (err) {
      this.logger.error(`Failed to send COD OTP to ${phone}: ${(err as Error).message}`);
      throw new BadRequestException('Could not send OTP right now. Please try again.');
    }
  }

  /** Returns a short-lived token proving this phone was verified. */
  async verify(rawPhone: string, code: string): Promise<{ token: string }> {
    const phone = CodOtpService.normalize(rawPhone);
    const stored = await this.redis.client.get(`codotp:code:${phone}`);
    if (!stored) throw new BadRequestException('OTP expired. Please request a new one.');

    const attempts = await this.redis.client.incr(`codotp:att:${phone}`);
    if (attempts === 1) await this.redis.client.expire(`codotp:att:${phone}`, OTP_TTL_S);
    if (attempts > MAX_VERIFY_ATTEMPTS) {
      await this.redis.client.del(`codotp:code:${phone}`);
      throw new BadRequestException('Too many wrong attempts. Please request a new OTP.');
    }
    if (code.trim() !== stored) throw new BadRequestException('Incorrect OTP.');

    await this.redis.client.del(`codotp:code:${phone}`, `codotp:att:${phone}`);
    const token = await this.jwt.signAsync(
      { phone, codVerified: true },
      { secret: this.jwtSecret, expiresIn: TOKEN_TTL },
    );
    return { token };
  }

  /** Used by checkout: is this token a valid COD verification for the phone? */
  async isPhoneVerified(token: string | undefined, rawPhone: string): Promise<boolean> {
    if (!token) return false;
    try {
      const payload = await this.jwt.verifyAsync<{ phone: string; codVerified: boolean }>(token, {
        secret: this.jwtSecret,
      });
      return payload.codVerified === true && payload.phone === CodOtpService.normalize(rawPhone);
    } catch {
      return false;
    }
  }
}
