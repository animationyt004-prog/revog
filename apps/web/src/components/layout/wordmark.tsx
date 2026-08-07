import { cn } from "@/lib/format";

/** The quatrefoil from the logo's divider, drawn as one petal rotated four
 *  times so every leaf is identical and the mark stays centred at any size. */
function Quatrefoil({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("shrink-0", className)}>
      <g fill="none" stroke="currentColor" strokeWidth="1.1">
        {[0, 90, 180, 270].map((deg) => (
          <path
            key={deg}
            d="M12 12C9.2 9.6 9.2 6.4 12 4C14.8 6.4 14.8 9.6 12 12Z"
            transform={`rotate(${deg} 12 12)`}
          />
        ))}
      </g>
    </svg>
  );
}

/**
 * The HYRALUXE lockup: the name in one line of display serif, closed by the
 * brand rose, over a hairline rule broken by a quatrefoil.
 *
 * The rule only appears at `lg` and `xl`. In the navbar the name sits at
 * `sm`, where a 20px flourish reads as smudge rather than ornament — and the
 * name alone is already noticeably wider than the old two-line stack, so the
 * bar has no room to spend on decoration.
 */
export function Wordmark({
  size = "md",
  tone = "light",
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  /** Surface the lockup sits on. On dark the hairline and flourish drop to a
   *  muted white; the rose dot is the mark itself and never shifts. */
  tone?: "light" | "dark";
  className?: string;
}) {
  const name = {
    sm: "text-lg tracking-[0.08em]",
    md: "text-xl tracking-[0.09em]",
    lg: "text-2xl tracking-[0.1em]",
    xl: "text-3xl tracking-[0.11em]",
  }[size];

  const withRule = size === "lg" || size === "xl";
  const glyph = size === "xl" ? "h-3.5 w-3.5" : "h-3 w-3";

  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      <span className={cn("display whitespace-nowrap leading-none", name)}>
        HYRALUXE<span className="text-volt">.</span>
      </span>
      {withRule && (
        <span
          aria-hidden
          className={cn(
            "mt-2 flex w-full items-center gap-2",
            tone === "dark" ? "text-white/45" : "text-ink/35",
          )}
        >
          <span className="h-px flex-1 bg-current" />
          <Quatrefoil className={glyph} />
          <span className="h-px flex-1 bg-current" />
        </span>
      )}
    </span>
  );
}
