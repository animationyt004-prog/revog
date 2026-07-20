import type { ReactNode } from "react";
import { Footer } from "./footer";
import { Navbar } from "./navbar";
import { PromoTicker } from "./promo-ticker";

/** Standard shell for static content pages (about, contact, policies). */
export function PageShell({
  title,
  accent = ".",
  intro,
  children,
}: {
  title: string;
  accent?: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <>
      <PromoTicker />
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="display text-4xl sm:text-5xl">
          {title}
          <span className="text-volt">{accent}</span>
        </h1>
        {intro && <p className="mt-3 text-sm leading-relaxed text-paper-dim">{intro}</p>}
        <div className="mt-8 space-y-7 text-sm leading-relaxed text-paper-dim">{children}</div>
      </main>
      <Footer />
    </>
  );
}

/** Section heading + body inside a PageShell. */
export function PolicySection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="display mb-2 text-xl text-paper">{heading}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
