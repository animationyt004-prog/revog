/**
 * Headings and labels keep their plain "&" — no ornamental glyph.
 *
 * This used to wrap every standalone "&" in a Playfair-italic span (`.amp` in
 * globals.css). In big display headings the flourish read as intentional, but
 * the same glyph in small labels ("COD & online payment", "Fabric & Drape")
 * looked like a font glitch: an italic serif character in the middle of
 * sans-serif text. The owner asked for the plain mark everywhere, so this is
 * now a pass-through and every call site renders an ordinary "&".
 *
 * Kept as a function (not deleted) because dozens of call sites route through
 * it; if the ornament ever returns, it returns in one place.
 */
export function amp(text: string): string {
  return text;
}
