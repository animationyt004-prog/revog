import type { Metadata } from "next";
import { PageShell, PolicySection } from "@/components/layout/page-shell";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "REVOG ships across India. Free shipping above ₹999, dispatch in 1–2 business days, delivery in 3–7 business days, Cash on Delivery available.",
  alternates: { canonical: "/policies/shipping" },
};

export default function ShippingPolicyPage() {
  const { policy } = BUSINESS;
  return (
    <PageShell
      title="Shipping Policy"
      accent="."
      intro="Where we deliver, what it costs, and how long it takes."
    >
      <PolicySection heading="Where we ship">
        <p>
          We ship across India to all serviceable pincodes. You can check delivery availability for
          your pincode on any product page before ordering.
        </p>
      </PolicySection>

      <PolicySection heading="Shipping charges">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Free shipping</strong> on all prepaid and Cash on Delivery orders above ₹
            {policy.freeShippingOver}.
          </li>
          <li>
            For orders below ₹{policy.freeShippingOver}, a flat shipping fee is shown at checkout
            before you pay.
          </li>
        </ul>
      </PolicySection>

      <PolicySection heading="Dispatch & delivery time">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Orders are packed and dispatched within <strong>{policy.dispatchDays}</strong> of being
            placed.
          </li>
          <li>
            Delivery usually takes <strong>{policy.deliveryDays}</strong> after dispatch, depending
            on your location.
          </li>
          <li>
            Remote pincodes, festivals, weather disruptions and courier delays can add a few days.
            We&apos;ll keep you posted if that happens.
          </li>
        </ul>
      </PolicySection>

      <PolicySection heading="Cash on Delivery">
        <p>
          Cash on Delivery (COD) is available on serviceable pincodes. Please keep the exact order
          amount ready — most of our delivery partners also accept UPI at the door.
        </p>
      </PolicySection>

      <PolicySection heading="Order tracking">
        <p>
          Once your order is dispatched, we share tracking details on the email and phone number
          given at checkout. You can also see the current status of any order from your order
          confirmation page.
        </p>
      </PolicySection>

      <PolicySection heading="Failed or refused deliveries">
        <p>
          Our courier partners attempt delivery multiple times. If a COD parcel is refused or nobody
          is available across all attempts, the parcel returns to us. Repeated refusals may mean we
          ask for prepayment on future orders.
        </p>
      </PolicySection>

      <PolicySection heading="Wrong or incomplete address">
        <p>
          Please double-check your address and phone number at checkout. If you spot a mistake,
          contact us immediately — we can usually correct it before dispatch. After dispatch, the
          address can&apos;t be changed.
        </p>
      </PolicySection>

      <PolicySection heading="Questions">
        <p>
          Anything unclear about a shipment? Reach us via the{" "}
          <a href="/contact" className="text-volt underline underline-offset-2">
            contact page
          </a>{" "}
          with your order number and we&apos;ll sort it out.
        </p>
      </PolicySection>
    </PageShell>
  );
}
