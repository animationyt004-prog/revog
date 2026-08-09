import { Footer } from "@/components/layout/footer";

// Account rendering starts from client session state, so stale static HTML can
// strand a signed-in customer on an obsolete loading shell after a deploy.
export const dynamic = "force-dynamic";

/**
 * The footer is rendered here rather than by the pages inside.
 *
 * Footer is an async server component — it reads which collections still hold
 * stock. Every page under /account is a client component, and an async
 * component inside a client tree throws on render. React then discards that
 * render and keeps the last commit on screen, which for these screens is the
 * "Opening your account" spinner: the session resolved, the page re-rendered,
 * and the throw meant nobody ever saw it. It looked exactly like a session
 * that never loaded.
 *
 * A layout is a server component, so the footer composes correctly here and
 * the pages below stay pure client trees.
 */
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
