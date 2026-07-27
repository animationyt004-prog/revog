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
  /** Reason the last send failed, surfaced to admins so a broken SMS account
   *  is diagnosable without shell access to the server logs. */
  private lastError: string | null = null;

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

  /** Provider health for the admin diagnostics endpoint. */
  get diagnostics(): {
    configured: boolean;
    testMode: boolean;
    lastError: string | null;
  } {
    return {
      configured: this.configured,
      testMode: this.configured && !this.realSms,
      lastError: this.lastError,
    };
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

  /** Send a 6-digit OTP. Throws on provider failure so callers can surface it.
   *  The thrown Error carries the provider's own reason — callers log it and
   *  show the customer something generic. */
  async sendOtp(phone: string, code: string): Promise<void> {
    if (!this.realSms) {
      this.logger.warn(`[SMS TEST MODE] OTP for ${phone}: ${code}`);
      return;
    }
    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${this.apiKey}&route=otp&variables_values=${code}&numbers=${phone}`;

    let res: Response;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    } catch (err) {
      // Timeout or DNS/network failure — never reached the provider.
      const reason = err instanceof Error ? err.message : String(err);
      this.lastError = `unreachable: ${reason}`;
      this.logger.error(`Fast2SMS unreachable: ${reason}`);
      throw new Error(this.lastError);
    }

    const body = await res.text().catch(() => '');
    // Fast2SMS signals most failures (bad key, no balance, blocked route) in
    // the JSON body while still answering 200, so the status alone can't be
    // trusted — an unchecked 200 would look like a delivered OTP that never
    // arrives.
    let ok = res.ok;
    let reason = `HTTP ${res.status}`;
    try {
      const json = JSON.parse(body) as { return?: boolean; message?: unknown };
      if (json.return === false) ok = false;
      // `message` is usually a string or an array of them, but the provider
      // has been known to nest objects — fall back to the raw JSON there.
      const msg = json.message;
      if (typeof msg === 'string') reason = msg;
      else if (Array.isArray(msg))
        reason = msg.map((m) => String(m)).join('; ');
      else if (msg) reason = JSON.stringify(msg);
    } catch {
      // Non-JSON body (HTML error page, WAF block) — keep the status as reason.
    }

    if (!ok) {
      this.lastError = reason.slice(0, 300);
      this.logger.error(
        `Fast2SMS send failed (${res.status}): ${this.lastError}`,
      );
      throw new Error(this.lastError);
    }
    this.lastError = null;
  }
}
