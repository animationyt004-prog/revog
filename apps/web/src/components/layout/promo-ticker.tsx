const MESSAGES = [
  "USE CODE NOCURFEW10 — FLAT 10% OFF ABOVE ₹999",
  "FREE SHIPPING OVER ₹999",
  "CASH ON DELIVERY AVAILABLE",
  "EASY 7-DAY RETURNS",
];

/** Loud scrolling offer strip pinned above the navbar. */
export function PromoTicker() {
  // Duplicate the sequence so the -50% translate loops seamlessly.
  const strip = [...MESSAGES, ...MESSAGES];
  return (
    <div className="overflow-hidden bg-volt text-ink" aria-label="Current offers">
      <div className="flex w-max animate-marquee whitespace-nowrap py-1.5">
        {strip.map((msg, i) => (
          <span
            key={i}
            className="display mx-6 text-[13px] tracking-wide sm:text-sm"
          >
            {msg} <span aria-hidden className="ml-6 select-none">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
