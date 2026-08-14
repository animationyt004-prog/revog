/** Link to an order's page.
 *
 *  These URLs used to carry `?email=`, which put the customer's address into
 *  the referrer of every request the page made and into the page URL reported
 *  by the Meta Pixel and GA. The view token proves the same entitlement without
 *  being personal data. The email stays as a fallback only for orders fetched
 *  before the API started issuing tokens. */
export function orderHref(
  order: { orderNumber: string; viewToken?: string | null },
  fallbackEmail?: string | null,
): string {
  if (order.viewToken) {
    return `/order/${order.orderNumber}?t=${encodeURIComponent(order.viewToken)}`;
  }
  return fallbackEmail
    ? `/order/${order.orderNumber}?email=${encodeURIComponent(fallbackEmail)}`
    : `/order/${order.orderNumber}`;
}
