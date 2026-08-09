import { Footer } from "@/components/layout/footer";

/**
 * Footer lives here rather than in the page for the same reason it does under
 * /account: it is an async server component, the wishlist page is a client
 * component, and an async component inside a client tree throws on render.
 * React then keeps the previous commit on screen, so the failure shows up as a
 * page that never finishes rather than as an error.
 */
export default function WishlistLayout({
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
