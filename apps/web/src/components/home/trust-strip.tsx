import { BadgeIndianRupee, MessageCircle, PackageCheck, RotateCcw, Truck } from "lucide-react";

/**
 * The five things a first-time buyer checks before trusting a small store:
 * can I pay on delivery, what does shipping cost, can I send it back, when
 * does it ship, and can I talk to a human. Kept factual — every claim here is
 * one the checkout and returns flow actually honour.
 */
const SIGNALS = [
  {
    icon: BadgeIndianRupee,
    // Both are live now: Razorpay went on with the webhook that confirms it,
    // so checkout offers UPI, cards and wallets alongside COD. Keep this line
    // in step with NEXT_PUBLIC_ENABLE_ONLINE_PAYMENT — it was overstating
    // before, and understating is just as misleading.
    title: "COD & online payment",
    detail: "Cash on Delivery, UPI, cards & wallets",
  },
  {
    icon: Truck,
    title: "Free shipping over ₹999",
    // ₹99 is SHIPPING_FEE in cart.service.ts — the number the cart actually
    // charges. Quoting anything else here undercharges the customer's
    // expectation and they find out at checkout.
    detail: "Flat ₹99 below that, delivered pan-India",
  },
  {
    icon: RotateCcw,
    title: "7-day returns",
    detail: "Easy returns & exchanges, no questions asked",
  },
  {
    icon: PackageCheck,
    title: "Dispatched in 1–2 days",
    // No warehouse location claimed: the registered business address is still
    // a placeholder, so naming a city here would be inventing a detail.
    detail: "Shipped pan-India on working days",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp support",
    detail: "Fabric, sizing or order help — just ask",
  },
];

export function TrustStrip() {
  return (
    <section aria-label="Why shop with us" className="border-y border-paper/10 bg-ink-2">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-5 px-4 py-7 sm:px-6 md:grid-cols-3 lg:grid-cols-5">
        {SIGNALS.map(({ icon: Icon, title, detail }) => (
          <li key={title} className="flex items-start gap-3">
            <Icon size={20} className="mt-0.5 shrink-0 text-volt" aria-hidden />
            <div>
              <p className="text-sm font-semibold leading-snug text-paper">{title}</p>
              <p className="mt-0.5 text-xs leading-snug text-paper-dim">{detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
