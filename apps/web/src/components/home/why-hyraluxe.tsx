import {
  BadgeIndianRupee,
  Gem,
  MessageCircle,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { FadeUp } from "@/components/motion";

/**
 * The long-form answer to "why buy here", sat deep in the page where a
 * shopper who has scrolled past the products is deciding whether to trust us.
 *
 * TrustStrip up by the hero is the short version - five logistics facts a
 * first-time buyer scans in two seconds. This one has room to say why the
 * clothes are worth it as well as how the order will behave, so the two are
 * deliberately not the same list.
 *
 * Every claim below is one the shop actually honours. The operational four
 * (payments, COD, delivery, returns) are enforced by checkout and the returns
 * flow. The judgement four (quality, curation, checking, support) are the
 * brand's own promises - keep them as promises about care and never let them
 * drift into unbacked specifics like certifications, awards or a "100%"
 * guarantee we would have to prove.
 */
const REASONS = [
  {
    icon: Sparkles,
    title: "Premium quality",
    detail: "Carefully selected fabrics and finishes.",
  },
  {
    icon: Gem,
    title: "Curated designs",
    detail: "Styles selected for today's Indian woman.",
  },
  {
    icon: PackageCheck,
    title: "Quality checked",
    detail: "Every order checked before dispatch.",
  },
  {
    icon: ShieldCheck,
    // Razorpay handles the card rails, so no card data ever reaches our
    // servers - that is what makes this line safe to print.
    title: "Secure payments",
    detail: "UPI, cards, net banking and wallets via Razorpay.",
  },
  {
    icon: BadgeIndianRupee,
    title: "COD available",
    detail: "Pay on delivery across serviceable pincodes.",
  },
  {
    icon: Truck,
    // "Pan-India" matches the shipping policy and the pincode checker; no
    // courier or guaranteed date is named because neither is contracted yet.
    title: "Pan-India delivery",
    detail: "Shipped nationwide on working days.",
  },
  {
    icon: RotateCcw,
    // 7 days is BUSINESS.policy.returnWindowDays - the window the returns
    // flow actually accepts. Do not round it up here.
    title: "Easy returns",
    detail: "7-day returns on unused items with tags.",
  },
  {
    icon: MessageCircle,
    title: "Customer first",
    detail: "WhatsApp support before and after your order.",
  },
];

export function WhyHyraluxe() {
  return (
    <section aria-labelledby="why-hyraluxe" className="bg-ink-2">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <FadeUp>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">
            Why HyraLuxe
          </p>
          <h2
            id="why-hyraluxe"
            className="display mt-3 max-w-xl text-3xl leading-tight sm:text-4xl"
          >
            Reasons to shop with us.
          </h2>
        </FadeUp>

        {/* Two columns on a phone rather than one: eight stacked rows pushed
            the section past two screens and buried the reviews below it.
            One FadeUp around the whole list, not one per item - FadeUp
            renders a div, and a div between <ul> and <li> is invalid. */}
        <FadeUp>
          <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-10 lg:grid-cols-4">
            {REASONS.map(({ icon: Icon, title, detail }) => (
              <li key={title} className="flex flex-col">
                <Icon
                  size={22}
                  strokeWidth={1.4}
                  className="text-gold"
                  aria-hidden
                />
                <p className="mt-3 text-sm font-semibold leading-snug text-paper">
                  {title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-paper-dim sm:text-sm">
                  {detail}
                </p>
              </li>
            ))}
          </ul>
        </FadeUp>
      </div>
    </section>
  );
}
