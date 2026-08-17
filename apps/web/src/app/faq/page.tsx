import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, PolicySection } from "@/components/layout/page-shell";
import { BUSINESS, formattedPhone } from "@/lib/business";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Answers to common questions about HyraLuxe orders: Cash on Delivery, shipping charges, delivery time, 7-day returns, refunds, blouse pieces and support.",
  alternates: { canonical: "/faq" },
};

/**
 * Every answer here is derived from something the shop actually enforces -
 * BUSINESS.policy, the cart's shipping rules, or the policy pages - rather
 * than written fresh. An FAQ is the page customers quote back to support, so
 * a number invented here becomes a promise we have to honour.
 *
 * Kept in step with: cart.service.ts (SHIPPING_FEE, FREE_SHIPPING_THRESHOLD),
 * /policies/shipping and /policies/returns.
 */
const FAQS: { q: string; a: string }[] = [
  {
    q: "Do you offer Cash on Delivery?",
    a: "Yes. Cash on Delivery is available across serviceable pincodes. You can check whether COD is available for your area using the pincode checker on any product page.",
  },
  {
    q: "What payment methods can I use?",
    a: "Online payments are handled by Razorpay, which supports UPI, credit and debit cards, net banking and wallets. Card details are never stored on our servers. Cash on Delivery is available as well.",
  },
  {
    q: "What are the shipping charges?",
    a: `Shipping is free on orders over ₹${BUSINESS.policy.freeShippingOver}. Below that a flat ₹99 is charged. The threshold is applied to your order total after any discount or coupon, so that is the figure to watch in your bag.`,
  },
  {
    q: "How long will my order take to arrive?",
    a: `Orders are dispatched in ${BUSINESS.policy.dispatchDays} on working days, and delivery usually takes ${BUSINESS.policy.deliveryDays} after dispatch, depending on your location. We ship pan-India.`,
  },
  {
    q: "Can I return an item?",
    a: `Yes. You have ${BUSINESS.policy.returnWindowDays} days from delivery to raise a return. The item must be unused, unwashed and unworn, with tags and packaging intact, and returned with the blouse piece it was shipped with.`,
  },
  {
    q: "How long does a refund take?",
    a: `Once the returned item reaches us and passes a quick quality check, the refund is issued and typically reaches you within ${BUSINESS.policy.refundDays}.`,
  },
  {
    q: "Is a blouse piece included with the saree?",
    a: "Most of our sarees ship with a blouse piece, but it varies by design — some are unstitched and a few come ready-to-wear. The product page for each saree states exactly what is included, so check there before ordering.",
  },
  {
    q: "How do I track my order?",
    a: "Open the tracking link from your order confirmation, or sign in and go to your account's Orders page. Once the courier picks the parcel up, the tracking details appear there.",
  },
  {
    q: "What size should I choose?",
    a: "Sarees are a free size, and the blouse piece is unstitched so it can be tailored to fit. For any stitched item, the size guide has the measurements we go by.",
  },
  {
    q: "How do I contact you?",
    a: `WhatsApp is the fastest route, and you can also email ${BUSINESS.email} or call ${formattedPhone()}. We are available ${BUSINESS.hours}.`,
  },
];

// FAQPage structured data. These are genuine question-and-answer pairs shown
// on the page itself, which is what Google requires - it must not describe
// content the visitor cannot see.
const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }}
      />
      <PageShell
        title="Frequently Asked"
        accent="Questions"
        intro="Orders, shipping, returns and everything else customers ask us most."
      >
        {FAQS.map(({ q, a }) => (
          <PolicySection key={q} heading={q}>
            <p>{a}</p>
          </PolicySection>
        ))}

        <PolicySection heading="Still need help?">
          <p>
            If your question isn&apos;t answered here, the full terms live on our{" "}
            <Link
              href="/policies/shipping"
              className="underline underline-offset-2 hover:text-volt"
            >
              shipping
            </Link>{" "}
            and{" "}
            <Link
              href="/policies/returns"
              className="underline underline-offset-2 hover:text-volt"
            >
              returns
            </Link>{" "}
            pages, or you can{" "}
            <Link
              href="/contact"
              className="underline underline-offset-2 hover:text-volt"
            >
              get in touch
            </Link>{" "}
            and a human will answer.
          </p>
        </PolicySection>
      </PageShell>
    </>
  );
}
