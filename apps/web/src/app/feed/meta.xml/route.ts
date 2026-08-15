import { getProduct, getProducts } from "@/lib/api";
import {
  metaFeedUnavailableXml,
  metaFeedXml,
} from "@/lib/meta-feed";
import type { ProductDetail } from "@/lib/types";

/**
 * Meta commerce catalogue feed. Add this URL in Commerce Manager as a
 * scheduled data source; the field-level reasoning lives in `lib/meta-feed`.
 *
 * Rebuilt hourly, matching the Google Merchant feed next door.
 */
export const revalidate = 3600;

/** Tells Meta to come back later instead of accepting an empty catalogue. */
function unavailable() {
  return new Response(metaFeedUnavailableXml(), {
    status: 503,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Retry-After": "300",
      "Cache-Control": "public, max-age=0, s-maxage=60",
    },
  });
}

export async function GET() {
  let list: Awaited<ReturnType<typeof getProducts>>;
  try {
    list = await getProducts({ take: 200 });
  } catch {
    return unavailable();
  }

  const details = await Promise.allSettled(list.map((p) => getProduct(p.slug)));
  const products = details.flatMap((r): ProductDetail[] =>
    r.status === "fulfilled" && r.value ? [r.value] : [],
  );

  // A feed of zero items is not a valid state — it is what an unreachable
  // product source looks like once `getProducts` has swallowed the error, which
  // it does during a production build. Serving that as a 200 would tell Meta to
  // delete every item in the catalogue; a 503 makes it retry and keep them.
  const xml = metaFeedXml(products);
  if (!xml.includes("<item>")) return unavailable();

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
