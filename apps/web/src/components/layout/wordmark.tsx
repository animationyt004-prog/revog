import { cn } from "@/lib/format";

/** The HYRA FASHION lockup: serif name over small tracked caps.
 *  `size` picks the name's type scale; the sub-label follows it. */
export function Wordmark({
  size = "md",
  tone = "light",
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  /** Surface the lockup sits on. On dark the rose dot loses contrast and the
   *  muted sub-label disappears, so both shift. */
  tone?: "light" | "dark";
  className?: string;
}) {
  const name = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  }[size];

  const sub = {
    sm: "text-[8px] tracking-[0.34em]",
    md: "text-[9px] tracking-[0.36em]",
    lg: "text-[10px] tracking-[0.4em]",
    xl: "text-xs tracking-[0.42em]",
  }[size];

  return (
    <span className={cn("inline-flex flex-col items-start leading-none", className)}>
      {/* The dot is the mark itself, so it keeps the brand rose on every
          surface — a gold one in the footer read as a second logo. Only the
          sub-label shifts for the backdrop. */}
      <span className={cn("display leading-none", name)}>
        HYRA<span className="text-volt">.</span>
      </span>
      <span
        className={cn(
          "mt-1 font-semibold uppercase",
          tone === "dark" ? "text-white/60" : "text-paper-dim",
          sub,
        )}
      >
        Fashion
      </span>
    </span>
  );
}
