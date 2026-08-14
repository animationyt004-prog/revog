import type { ReactNode } from "react";

/**
 * Content wrappers intentionally render visible in the server HTML. Product
 * discovery must not depend on hydration or IntersectionObserver support.
 * The delay prop stays in the API so sections can opt back into progressive
 * enhancement later without changing every caller.
 */
export function FadeUp({
  children,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
