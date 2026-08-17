import { Fragment, type ReactNode } from "react";

/**
 * Wraps every standalone "&" in a string so it can be set as ornament rather
 * than as a bold letter — see `.amp` in globals.css.
 *
 * Applied centrally by the display-heading components instead of at each call
 * site, so headings stay plain strings ("Returns & Refunds") and no author has
 * to remember the markup. Only a free-standing ampersand is matched, so
 * "R&D" or "AT&T" keep their upright roman form, which is correct: there the
 * ampersand is part of a word, not a conjunction between two.
 */
export function amp(text: string): ReactNode {
  if (!text.includes("&")) return text;

  // Lookaround, so the surrounding spaces stay in the neighbouring text rather
  // than being consumed and re-emitted. Word spacing then has exactly one
  // source - the original string - and `.amp` only nudges it optically. An
  // earlier version split on /(\s&\s)/ and printed its own {" "}, which
  // stacked two kinds of space and left the glyph 11.7px from the word on its
  // left and 2.9px from the one on its right.
  const parts = text.split(/(?<= )(&)(?= )/);
  return parts.map((part, i) =>
    part === "&" ? (
      <span key={i} className="amp">
        &amp;
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
