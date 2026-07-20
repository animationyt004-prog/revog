import type { Metadata } from "next";
import { PageShell, PolicySection } from "@/components/layout/page-shell";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that apply when you shop with REVOG — orders, pricing, payments, delivery, returns and acceptable use.",
  alternates: { canonical: "/policies/terms" },
};

export default function TermsPage() {
  return (
    <PageShell
      title="Terms of Service"
      accent="."
      intro={`These terms apply whenever you browse or buy from ${BUSINESS.name}.`}
    >
      <PolicySection heading="Agreement">
        <p>
          By using this website or placing an order, you agree to these terms. If you don&apos;t
          agree with them, please don&apos;t use the site.
        </p>
      </PolicySection>

      <PolicySection heading="Products & descriptions">
        <p>
          We describe every product as accurately as we can, including fabric and what&apos;s
          included in the box. Sarees are sold with an <strong>unstitched blouse piece</strong>; any
          styled blouse worn by a model in a photo is for reference only and is not part of the
          product unless the description says so.
        </p>
        <p>
          Handloom and printed fabrics carry small natural variations in weave, print placement and
          shade. These are characteristics of the fabric, not defects.
        </p>
      </PolicySection>

      <PolicySection heading="Pricing">
        <p>
          All prices are in Indian Rupees (₹) and inclusive of applicable taxes unless stated
          otherwise. Shipping charges, if any, are shown at checkout before payment. We may change
          prices or run offers at any time, but the price you see at checkout is the price you pay
          for that order.
        </p>
        <p>
          If a product is listed at an obviously incorrect price due to a technical error, we may
          cancel the order and refund you in full rather than fulfil it.
        </p>
      </PolicySection>

      <PolicySection heading="Orders & acceptance">
        <p>
          Placing an order is an offer to buy. We accept it when we confirm and dispatch the order.
          We may decline or cancel an order — with a full refund — if an item is out of stock, the
          address is not serviceable, or we suspect fraud or misuse.
        </p>
      </PolicySection>

      <PolicySection heading="Payments">
        <p>
          We accept Cash on Delivery on serviceable pincodes, and online payments where enabled.
          Online payments are processed by a third-party payment gateway; we never receive or store
          your card, UPI or banking credentials.
        </p>
      </PolicySection>

      <PolicySection heading="Delivery, returns & refunds">
        <p>
          Delivery timelines and charges are set out in our{" "}
          <a href="/policies/shipping" className="text-volt underline underline-offset-2">
            Shipping Policy
          </a>
          , and returns and refunds in our{" "}
          <a href="/policies/returns" className="text-volt underline underline-offset-2">
            Returns &amp; Refunds Policy
          </a>
          . Both form part of these terms.
        </p>
      </PolicySection>

      <PolicySection heading="Coupons & offers">
        <p>
          Discount codes are for personal use, can&apos;t be exchanged for cash, may have a minimum
          order value, and can be withdrawn at any time. We may cancel orders where a code has been
          misused.
        </p>
      </PolicySection>

      <PolicySection heading="Acceptable use">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Don&apos;t use the site for anything unlawful or fraudulent.</li>
          <li>
            Don&apos;t copy, scrape or republish our photographs, descriptions or branding without
            written permission.
          </li>
          <li>Don&apos;t attempt to disrupt, overload or gain unauthorised access to the site.</li>
        </ul>
      </PolicySection>

      <PolicySection heading="Intellectual property">
        <p>
          The {BUSINESS.name} name, logo, site design and our own product photography and copy
          belong to us and may not be used without permission.
        </p>
      </PolicySection>

      <PolicySection heading="Liability">
        <p>
          To the extent permitted by law, our liability for any order is limited to the amount you
          paid for that order. We aren&apos;t liable for delays caused by courier partners, weather,
          strikes or other events outside our reasonable control.
        </p>
      </PolicySection>

      <PolicySection heading="Governing law">
        <p>
          These terms are governed by the laws of India, and disputes are subject to the
          jurisdiction of the courts where our registered office is located.
        </p>
      </PolicySection>

      <PolicySection heading="Contact">
        <p>
          Questions about these terms? Reach us at{" "}
          <a href={`mailto:${BUSINESS.email}`} className="text-volt underline underline-offset-2">
            {BUSINESS.email}
          </a>{" "}
          or via our{" "}
          <a href="/contact" className="text-volt underline underline-offset-2">
            contact page
          </a>
          .
        </p>
      </PolicySection>
    </PageShell>
  );
}
