/** Google Ads tag configuration, shared by the loader and the event helpers.
 *
 *  There are two Ads accounts in play: the one the campaigns run in and the one
 *  the Purchase conversion action was created in. A conversion only registers
 *  if its send_to names the account that owns the label, so we configure every
 *  id listed here and let the label carry its own account prefix. */

/** Comma-separated so several accounts can be tagged at once. */
export const ADS_IDS = (
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "AW-18325515272,AW-18327470048"
)
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

/** GA4 measurement id (G-XXXXXXXXXX) — set once a GA4 property exists. */
export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;

/**
 * Resolve a conversion label into a full gtag `send_to`.
 *
 * Accepts either a bare label ("AbCdEf...", assumed to belong to the first
 * configured account) or an already-qualified "AW-XXXXXXXXX/AbCdEf...", which
 * is what you get by pasting straight out of the Ads conversion snippet.
 */
export function sendTo(label: string | undefined): string | null {
  if (!label) return null;
  if (label.includes("/")) return label;
  return ADS_IDS[0] ? `${ADS_IDS[0]}/${label}` : null;
}
