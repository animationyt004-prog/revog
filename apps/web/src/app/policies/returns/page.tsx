import type { Metadata } from "next";
import { PageShell, PolicySection } from "@/components/layout/page-shell";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Returns & Refunds",
  description:
    "Easy 7-day returns at REVOG. Return unused items with tags intact and get a refund within 5–7 business days. Here's exactly how it works.",
  alternates: { canonical: "/policies/returns" },
};

export default function ReturnsPolicyPage() {
  const { policy } = BUSINESS;
  return (
    <PageShell
      title="Returns & Refunds"
      accent="."
      intro={`If something isn't right, you have ${policy.returnWindowDays} days from delivery to return it.`}
    >
      <PolicySection heading="Return window">
        <p>
          You can request a return within <strong>{policy.returnWindowDays} days of delivery</strong>.
          Requests raised after this window can&apos;t be accepted.
        </p>
      </PolicySection>

      <PolicySection heading="What can be returned">
        <p>To be eligible, the item must be:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Unused, unwashed and unworn, with no stains, marks or odour.</li>
          <li>In its original condition with all tags and packaging intact.</li>
          <li>Accompanied by the unstitched blouse piece it was shipped with.</li>
        </ul>
        <p>
          Items that have been stitched, altered, washed or damaged after delivery can&apos;t be
          returned.
        </p>
      </PolicySection>

      <PolicySection heading="How to raise a return">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>Open your order from the order confirmation link or your account.</li>
          <li>Choose the item and select &ldquo;Request return&rdquo; with a short reason.</li>
          <li>We confirm the request and arrange a pickup wherever the courier services it.</li>
          <li>Once the item reaches us and passes a quick quality check, the refund is issued.</li>
        </ol>
        <p>
          Prefer to talk to a person? Message us from the{" "}
          <a href="/contact" className="text-volt underline underline-offset-2">
            contact page
          </a>{" "}
          with your order number.
        </p>
      </PolicySection>

      <PolicySection heading="Refunds">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Refunds are processed within <strong>{policy.refundDays}</strong> after the returned item
            passes its quality check.
          </li>
          <li>Prepaid orders are refunded to the original payment method.</li>
          <li>
            Cash on Delivery orders are refunded to a bank account or UPI ID you share with us.
          </li>
          <li>
            Shipping charges paid on an order are refunded only when the return is due to a defect
            or a wrong item sent by us.
          </li>
        </ul>
      </PolicySection>

      <PolicySection heading="Damaged, defective or wrong item">
        <p>
          If your parcel arrives damaged, defective, or with the wrong product, contact us within{" "}
          <strong>48 hours of delivery</strong> with photos. We&apos;ll arrange a replacement or a
          full refund including any shipping charges — this is on us, not you.
        </p>
        <p>
          An unboxing photo or video helps us resolve these cases much faster, so please take one if
          the parcel looks tampered with.
        </p>
      </PolicySection>

      <PolicySection heading="Exchanges">
        <p>
          Since most of our sarees are free size and stock moves quickly, we handle exchanges as a
          return plus a fresh order. Raise a return, and place a new order for the piece you want.
        </p>
      </PolicySection>

      <PolicySection heading="Order cancellation">
        <p>
          You can cancel an order any time before it is dispatched — contact us and we&apos;ll cancel
          it and refund any amount already paid. Once dispatched, the return process above applies.
        </p>
      </PolicySection>

      <PolicySection heading="Colour note">
        <p>
          Screens vary, so a fabric&apos;s colour can look slightly different in person. We photograph
          our products in natural light and describe colours as accurately as we can. A minor shade
          variation isn&apos;t considered a defect, but if a piece is clearly not what was shown,
          tell us and we&apos;ll make it right.
        </p>
      </PolicySection>
    </PageShell>
  );
}
