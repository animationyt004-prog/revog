import { OrdersView } from "@/components/account/orders-view";

// Forces this route to always be a serverless function rather than a
// prerendered static page. Route-segment config only works in Server
// Components, hence this thin wrapper around the client view — and it
// works around a Vercel builder bug ("Unable to find lambda for route")
// that hits certain static nested App Router pages.
export const dynamic = "force-dynamic";

export default function AccountOrdersPage() {
  return <OrdersView />;
}
