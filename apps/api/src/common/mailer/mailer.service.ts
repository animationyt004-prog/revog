import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Thin wrapper over Resend's REST API (no SDK — global fetch is enough).
 * When RESEND_API_KEY is unset (local dev), emails are logged instead of sent
 * so the OTP flow keeps working without an account.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly apiKey: string | undefined;
  private readonly from: string;
  /** Reason the last send failed, for the admin diagnostics endpoint. */
  private lastError: string | null = null;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('RESEND_API_KEY') || undefined;
    // Our own verified domain is the default. Resend's shared
    // onboarding@resend.dev sender is deliberately NOT the fallback: it only
    // delivers to the Resend account owner, so every real customer would get
    // a 403 while the store looked fine to whoever was testing it.
    this.from =
      config.get<string>('OTP_FROM_EMAIL') ||
      'Hyra Fashion <login@hyrafashions.com>';
  }

  get configured(): boolean {
    return !!this.apiKey;
  }

  /** Provider health for the admin diagnostics endpoint. */
  get diagnostics(): {
    configured: boolean;
    from: string;
    lastError: string | null;
  } {
    return {
      configured: this.configured,
      from: this.from,
      lastError: this.lastError,
    };
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.apiKey) {
      this.logger.warn(
        `Email not sent (RESEND_API_KEY unset) — to=${to} subject="${subject}"`,
      );
      return;
    }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: this.from, to, subject, html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      // Resend puts the useful part ("domain is not verified", quota, bad key)
      // in a JSON `message`; keep it on the Error so callers can log it.
      let reason = `HTTP ${res.status}`;
      try {
        const json = JSON.parse(body) as { message?: unknown };
        if (typeof json.message === 'string') reason = json.message;
      } catch {
        if (body) reason = body.slice(0, 300);
      }
      this.lastError = reason.slice(0, 300);
      this.logger.error(
        `Resend send failed (${res.status}): ${this.lastError}`,
      );
      throw new Error(this.lastError);
    }
    this.lastError = null;
  }

  /** Branded OTP email. */
  async sendOtp(to: string, code: string): Promise<void> {
    const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:440px;margin:0 auto;padding:32px 24px;color:#0d0d0e">
  <p style="font-size:26px;font-weight:800;letter-spacing:1px;margin:0 0 24px">HYRA<span style="color:#4d7c0f">.</span> FASHION</p>
  <p style="font-size:15px;margin:0 0 8px">Your one-time login code:</p>
  <p style="font-size:40px;font-weight:800;letter-spacing:10px;margin:8px 0 20px;color:#0d0d0e">${code}</p>
  <p style="font-size:13px;color:#63635d;margin:0 0 4px">Valid for 10 minutes. Never share this code with anyone.</p>
  <p style="font-size:13px;color:#63635d;margin:0">If you didn't request this, you can safely ignore this email.</p>
  <hr style="border:none;border-top:1px solid #e9e9e4;margin:24px 0" />
  <p style="font-size:11px;color:#9a9a92;margin:0">Hyra Fashion — Indian fashion, all in one place.</p>
</div>`.trim();
    await this.send(to, `${code} is your Hyra Fashion login code`, html);
  }
}
