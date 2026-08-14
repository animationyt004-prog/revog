import type { ProductImageData } from "./types";

const norm = (s: string) => s.trim().toLowerCase();

/**
 * The images that show a given variant colour, or null when none can be
 * confidently attributed to it.
 *
 * Image colour tags are typed by hand in admin and drift from the variant
 * names — one saree has a "Blue" variant whose photos are tagged "Blue Grey".
 * A strict equality check finds nothing there and the caller silently falls
 * back to the whole gallery, which is how a blue variant ends up showing a
 * beige photo. So: exact match wins; failing that, a single colour group whose
 * tag extends the variant name (or vice versa) is accepted. Anything more
 * ambiguous than that returns null rather than guessing.
 */
export function imagesForColor(
  images: ProductImageData[],
  color: string | null | undefined,
): ProductImageData[] | null {
  if (!color) return null;
  const want = norm(color);

  const exact = images.filter((i) => i.color && norm(i.color) === want);
  if (exact.length) return exact;

  const near = images.filter((i) => {
    if (!i.color) return false;
    const c = norm(i.color);
    return c.startsWith(want) || want.startsWith(c);
  });
  const distinct = new Set(near.map((i) => norm(i.color as string)));
  return near.length && distinct.size === 1 ? near : null;
}
