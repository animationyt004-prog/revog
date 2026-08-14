import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

export type MetaEventName =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'Lead'
  | 'Purchase';

interface MetaEvent {
  eventName: MetaEventName;
  eventId?: string;
  eventSourceUrl?: string;
  actionSource?: 'website';
  userData?: {
    clientIpAddress?: string;
    clientUserAgent?: string;
    email?: string;
    phone?: string;
    fbp?: string;
    fbc?: string;
  };
  customData?: Record<string, unknown>;
}

/** One pixel the server reports to. Access tokens are issued per pixel, so a
 *  pixel needs its own unless one System User token covers several. */
interface PixelTarget {
  pixelId: string;
  accessToken: string;
}

const PURCHASE_RETRY_DELAY_MS = 2000;

/**
 * True when Meta is saying this token can never post to this pixel — a missing
 * grant or a dead token — as opposed to a per-event complaint (bad customer
 * data, rate limit) that a later event may well pass. Only the former is worth
 * giving up on, and giving up matters: the alternative is a warning per event.
 */
function isPermanentPixelError(body: string): boolean {
  return (
    body.includes('GraphMethodException') ||
    body.includes('"code":190') ||
    body.includes('does not exist, cannot be loaded due to missing permissions')
  );
}

@Injectable()
export class MetaConversionsService {
  private readonly logger = new Logger(MetaConversionsService.name);
  private readonly targets: PixelTarget[];
  /** Pixels the configured token cannot post to; see isPermanentPixelError. */
  private readonly unreachable = new Set<string>();
  private readonly testEventCode: string | undefined;

  constructor(config: ConfigService) {
    const primaryToken = config.get<string>('META_CAPI_ACCESS_TOKEN');
    const configured = config.get<string>('META_PIXEL_IDS');

    // Per-pixel tokens are only needed when one System User does not cover
    // them all; otherwise every pixel reuses the primary token.
    const tokenFor = (pixelId: string): string | undefined =>
      config.get<string>(`META_CAPI_ACCESS_TOKEN_${pixelId}`) || primaryToken;

    // Every dataset the storefront's pixel fires at has to be listed here too,
    // or that dataset silently loses everything iOS and ad blockers drop from
    // the browser side. META_PIXEL_IDS is the list; the two older single-ID
    // vars are still honoured and merged in. Pixel IDs are public — they ship
    // in the page HTML — so the secret is only ever the token.
    const pixelIds = (
      configured
        ? configured.split(',')
        : [
            config.get<string>('META_PIXEL_ID'),
            config.get<string>('NEXT_PUBLIC_META_PIXEL_ID'),
            config.get<string>('META_ADDITIONAL_PIXEL_ID'),
          ]
    )
      .map((id) => (id ?? '').trim())
      .filter((id, i, all) => /^\d{10,20}$/.test(id) && all.indexOf(id) === i);

    this.targets = pixelIds
      .map((pixelId) => ({ pixelId, accessToken: tokenFor(pixelId) }))
      .filter((t): t is PixelTarget => Boolean(t.accessToken));

    if (pixelIds.length === 0) {
      this.logger.warn(
        'No Meta pixel IDs configured — server-side events are disabled. Set ' +
          'META_PIXEL_IDS (comma-separated) to the same datasets the ' +
          "storefront's NEXT_PUBLIC_META_PIXEL_IDS fires at.",
      );
    } else if (this.targets.length === 0) {
      this.logger.warn(
        'No Meta Conversions API token — server-side events are disabled.',
      );
    } else {
      this.logger.log(
        `Meta Conversions API reporting to ${this.targets.length} pixel(s): ` +
          this.targets.map((t) => t.pixelId).join(', '),
      );
    }

    // Set only while watching Events Manager > Test Events. Events sent with a
    // test code go to that tool instead of reporting, so leaving this set in
    // production would silently stop every server-side conversion counting.
    this.testEventCode =
      config.get<string>('META_TEST_EVENT_CODE') || undefined;
    if (this.testEventCode) {
      this.logger.warn(
        `META_TEST_EVENT_CODE=${this.testEventCode} is set — server events are ` +
          'being routed to Test Events and will NOT count as conversions.',
      );
    }
  }

  private hash(value?: string | null): string | undefined {
    const normalized = value?.trim().toLowerCase();
    if (!normalized) return undefined;
    return createHash('sha256').update(normalized).digest('hex');
  }

  async send(event: MetaEvent): Promise<void> {
    if (this.targets.length === 0) return;

    const userData = {
      client_ip_address: event.userData?.clientIpAddress,
      client_user_agent: event.userData?.clientUserAgent,
      em: this.hash(event.userData?.email),
      ph: this.hash(event.userData?.phone?.replace(/\D/g, '')),
      fbp: event.userData?.fbp,
      fbc: event.userData?.fbc,
    };

    const payload = {
      ...(this.testEventCode ? { test_event_code: this.testEventCode } : {}),
      data: [
        {
          event_name: event.eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: event.eventId,
          event_source_url: event.eventSourceUrl,
          action_source: event.actionSource ?? 'website',
          user_data: Object.fromEntries(
            Object.entries(userData).filter(([, v]) => Boolean(v)),
          ),
          custom_data: event.customData,
        },
      ],
    };

    // Every pixel is reported to independently: one pixel's bad token or
    // outage must not stop the others receiving the event.
    const reachable = this.targets.filter(
      (t) => !this.unreachable.has(t.pixelId),
    );
    const results = await Promise.all(
      reachable.map((target) => this.post(target, event.eventName, payload)),
    );

    // Purchase is the only event whose loss actually costs money: nothing
    // re-sends it, so a momentary 5xx or dropped connection retires that sale
    // from ad reporting for good. Cheaper events are left to fail.
    //
    // The retry is deliberately not awaited. sendPurchase() sits inside the
    // payment-verification response, and a shopper staring at a spinner must
    // not wait out a backoff for an analytics call.
    if (event.eventName !== 'Purchase') return;
    for (const [i, outcome] of results.entries()) {
      if (outcome !== 'retryable') continue;
      const target = reachable[i];
      this.logger.warn(
        `Retrying Meta CAPI Purchase for pixel ${target.pixelId} in ` +
          `${PURCHASE_RETRY_DELAY_MS}ms.`,
      );
      setTimeout(() => {
        // Failing twice is where it ends — post() has already logged both.
        void this.post(target, event.eventName, payload);
      }, PURCHASE_RETRY_DELAY_MS).unref();
    }
  }

  /** One POST to one pixel. Never throws; the caller decides what a failure
   *  is worth. */
  private async post(
    { pixelId, accessToken }: PixelTarget,
    eventName: MetaEventName,
    payload: unknown,
  ): Promise<'ok' | 'failed' | 'retryable'> {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${encodeURIComponent(
          accessToken,
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) return 'ok';

      const body = await res.text().catch(() => '');
      if (isPermanentPixelError(body)) {
        // The token cannot reach this pixel and never will without a new one.
        // Retrying per event would only spam the log, so it is dropped until
        // the next restart picks up fresh config.
        this.unreachable.add(pixelId);
        this.logger.warn(
          `Pixel ${pixelId} is not reachable with the configured ` +
            'token — skipping its server-side events until restart. ' +
            `Set META_CAPI_ACCESS_TOKEN_${pixelId}, or grant the ` +
            `current System User access. Meta said: ${body.slice(0, 200)}`,
        );
        return 'failed';
      }
      this.logger.warn(
        `Meta CAPI ${eventName} failed for pixel ${pixelId}: ` +
          `${res.status} ${body.slice(0, 300)}`,
      );
      // A 4xx is Meta rejecting this payload — sending the same bytes again
      // gets the same answer. Only server trouble and throttling are worth
      // another go.
      return res.status >= 500 || res.status === 429 ? 'retryable' : 'failed';
    } catch (err) {
      this.logger.warn(
        `Meta CAPI ${eventName} error for pixel ${pixelId}: ` +
          `${(err as Error).message}`,
      );
      return 'retryable';
    }
  }
}
