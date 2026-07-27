import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Thin wrapper over Fast2SMS's OTP route, shared by login OTP and COD
 * verification. The OTP route uses the provider's own DLT-approved template,
 * so no sender-id/template registration is needed on our side.
 *
 * When FAST2SMS_API_KEY is unset the service reports unconfigured; when it is
 * the literal "TEST" the flow stays enabled but codes are logged instead of
 * sent, so everything is testable without an SMS balance.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('FAST2SMS_API_KEY') ?? '';
  }

  /** Any key (including "TEST") switches SMS-gated features on. */
  get configured(): boolean {
    return this.apiKey.length > 0;
  }

  /** True only with a real provider key — TEST mode logs instead. */
  get realSms(): boolean {
    return this.apiKey.length > 0 && this.apiKey !== 'TEST';
  }

  /** Strip to the bare 10-digit Indian mobile ("+91 99245 75799" → "9924575799"). */
  static normalizePhone(phone: string): string {
    return phone
      .replace(/\D/g, '')
      .replace(/^91(?=\d{10}$)/, '')
      .slice(-10);
  }

  static isValidPhone(phone: string): boolean {
    return /^[6-9]\d{9}$/.test(phone);
  }

  /** Send a 6-digit OTP. Throws on provider failure so callers can surface it. */
  async sendOtp(phone: string, code: string): Promise<void> {
    if (!this.realSms) {
      this.logger.warn(`[SMS TEST MODE] OTP for ${phone}: ${code}`);
      return;
    }
    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${this.apiKey}&route=otp&variables_values=${code}&numbers=${phone}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      this.logger.error(
        `Fast2SMS send failed (${res.status}): ${detail.slice(0, 300)}`,
      );
      throw new Error('SMS provider error');
    }
  }
}
