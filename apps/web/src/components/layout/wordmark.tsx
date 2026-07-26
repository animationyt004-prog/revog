import { cn } from "@/lib/format";

/** The HYRA FASHION lockup: serif name over small tracked caps.
 *  `size` picks the name's type scale; the sub-label follows it. */
export function Wordmark({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
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
      <span className={cn("display leading-none", name)}>
        HYRA<span className="text-volt">.</span>
      </span>
      <span className={cn("mt-1 font-semibold uppercase text-paper-dim", sub)}>Fashion</span>
    </span>
  );
}
