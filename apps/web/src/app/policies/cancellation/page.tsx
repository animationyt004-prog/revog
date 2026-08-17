import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, PolicySection } from "@/components/layout/page-shell";
import { BUSINESS, formattedPhone } from "@/lib/business";

export const metadata: Metadata = {
  title: "Cancellation Policy",
  description:
    "How to cancel a HyraLuxe order. Orders can be cancelled before dispatch by contacting support; after dispatch, use the 7-day return window instead.",
  alternates: { canonical: "/policies/cancellation" },
};

/**
 * Written against what the system actually does, not what is convenient to
 * promise. Two constraints shaped this page:
 *
 * 1. There is no self-serve cancel button. The status machine in
 *    admin.service.ts only lets staff move an order to CANCELLED, so this
 *    page must send customers to support rather than to their account.
 * 2. Nothing auto-refunds a cancelled prepaid order - payments.service.ts has
 *    no cancellation refund path - so refunds are described as initiated by
 *    us, on the returns policy's stated timeline, not as instant.
 */
export default function CancellationPolicyPage() {
  const { policy } = BUSINESS;

  return (
    <PageShell
      title="Cancellation"
      accent="Policy"
      intro="Changed your mind? Here is what can be cancelled, and when."
    >
      <PolicySection heading="Before your order is dispatched">
        <p>
          Orders can be cancelled any time before they are dispatched, which is
          usually within {policy.dispatchDays} of you placing the order. There
          is no cancellation fee.
        </p>
        <p>
          We do not have a self-service cancel button yet, so message us on
          WhatsApp or email{" "}
          <a
            href={`mailto:${BUSINESS.email}`}
            className="underline underline-offset-2 hover:text-volt"
          >
            {BUSINESS.email}
          </a>{" "}
          with your order number and we will cancel it for you. The sooner you
          reach us the better — once a parcel is handed to the courier it can
          no longer be stopped.
        </p>
      </PolicySection>

      <PolicySection heading="After your order is dispatched">
        <p>
          Once an order is with the courier it cannot be cancelled. You have two
          options:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Refuse the delivery when the courier arrives, and the parcel comes
            back to us.
          </li>
          <li>
            Accept it and raise a return within{" "}
            {policy.returnWindowDays} days, under our{" "}
            <Link
              href="/policies/returns"
              className="underline underline-offset-2 hover:text-volt"
            >
              returns policy
            </Link>
            .
          </li>
        </ul>
      </PolicySection>

      <PolicySection heading="Refunds on cancelled orders">
        <p>
          If you paid by Cash on Delivery there is nothing to refund — no money
          changes hands until delivery.
        </p>
        <p>
          For prepaid orders, we initiate the refund to the original payment
          method once the cancellation is confirmed. It typically reaches you
          within {policy.refundDays}, depending on your bank or UPI provider.
        </p>
      </PolicySection>

      <PolicySection heading="Cancellations by us">
        <p>
          Occasionally we may have to cancel an order ourselves — if an item
          turns out to be out of stock, if the delivery address is outside our
          serviceable pincodes, or if payment could not be verified. If that
          happens we will tell you why, and any amount already paid is refunded
          in full.
        </p>
      </PolicySection>

      <PolicySection heading="Need to cancel something?">
        <p>
          Message us on WhatsApp, email{" "}
          <a
            href={`mailto:${BUSINESS.email}`}
            className="underline underline-offset-2 hover:text-volt"
          >
            {BUSINESS.email}
          </a>{" "}
          or call {formattedPhone()}. We are available {BUSINESS.hours}. Keep
          your order number handy — it is in your order confirmation email.
        </p>
      </PolicySection>
    </PageShell>
  );
}
