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

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('RESEND_API_KEY') || undefined;
    // e.g. "REVOG <otp@yourdomain.com>" — falls back to Resend's shared
    // onboarding sender, which works for testing without a verified domain.
    this.from = config.get<string>('OTP_FROM_EMAIL') || 'REVOG <onboarding@resend.dev>';
  }

  get configured(): boolean {
    return !!this.apiKey;
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.apiKey) {
      this.logger.warn(`Email not sent (RESEND_API_KEY unset) — to=${to} subject="${subject}"`);
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
      const detail = await res.text().catch(() => '');
      this.logger.error(`Resend send failed (${res.status}): ${detail.slice(0, 300)}`);
      throw new Error('Failed to send email.');
    }
  }

  /** Branded OTP email. */
  async sendOtp(to: string, code: string): Promise<void> {
    const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:440px;margin:0 auto;padding:32px 24px;color:#0d0d0e">
  <p style="font-size:26px;font-weight:800;letter-spacing:1px;margin:0 0 24px">REVOG<span style="color:#4d7c0f">.</span></p>
  <p style="font-size:15px;margin:0 0 8px">Your one-time login code:</p>
  <p style="font-size:40px;font-weight:800;letter-spacing:10px;margin:8px 0 20px;color:#0d0d0e">${code}</p>
  <p style="font-size:13px;color:#63635d;margin:0 0 4px">Valid for 10 minutes. Never share this code with anyone.</p>
  <p style="font-size:13px;color:#63635d;margin:0">If you didn't request this, you can safely ignore this email.</p>
  <hr style="border:none;border-top:1px solid #e9e9e4;margin:24px 0" />
  <p style="font-size:11px;color:#9a9a92;margin:0">REVOG — streetwear without permission.</p>
</div>`.trim();
    await this.send(to, `${code} is your REVOG login code`, html);
  }
}
