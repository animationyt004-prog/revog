import type { Metadata } from "next";
import { PageShell, PolicySection } from "@/components/layout/page-shell";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How REVOG collects, uses and protects your personal information — what we store, who we share it with, and the choices you have.",
  alternates: { canonical: "/policies/privacy" },
};

export default function PrivacyPolicyPage() {
  return (
    <PageShell
      title="Privacy Policy"
      accent="."
      intro="What we collect, why we collect it, and what you can ask us to do with it."
    >
      <PolicySection heading="Information we collect">
        <p>We only collect what we need to run the store and deliver your orders:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Order details</strong> — name, delivery address, pincode, phone number and email
            address you enter at checkout.
          </li>
          <li>
            <strong>Account details</strong> — your email address, if you choose to sign in. An
            account is optional; you can shop entirely as a guest.
          </li>
          <li>
            <strong>Usage data</strong> — pages viewed, items added to cart and similar activity,
            used to understand what&apos;s working on the site.
          </li>
        </ul>
        <p>
          We do <strong>not</strong> collect or store your card, UPI or netbanking credentials. Online
          payments are handled entirely by our payment gateway.
        </p>
      </PolicySection>

      <PolicySection heading="How we use it">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>To process, pack, deliver and support your orders.</li>
          <li>To contact you about an order, a return or a delivery issue.</li>
          <li>To improve the store — which products people look for, where checkout gets stuck.</li>
          <li>To prevent fraud and misuse.</li>
        </ul>
      </PolicySection>

      <PolicySection heading="Who we share it with">
        <p>We share the minimum necessary with service providers who help us operate:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Courier partners</strong> — your name, address and phone number, so they can
            deliver your parcel.
          </li>
          <li>
            <strong>Payment gateway</strong> — to process online payments securely. They handle your
            payment details directly; we never see them.
          </li>
          <li>
            <strong>Email service</strong> — to send login codes and order updates.
          </li>
          <li>
            <strong>Analytics &amp; advertising tools</strong> (such as Google and Meta) — to measure
            site traffic and ad performance.
          </li>
        </ul>
        <p>We do not sell your personal information to anyone.</p>
      </PolicySection>

      <PolicySection heading="Cookies">
        <p>
          We use cookies to keep your cart and session working, remember whether you&apos;re signed
          in, and measure traffic. Blocking cookies in your browser may break the cart or checkout.
        </p>
      </PolicySection>

      <PolicySection heading="Data retention">
        <p>
          Order records are kept as long as needed for accounting, tax and warranty/return purposes.
          Analytics data is kept in aggregate. You can ask us to delete your account data at any
          time, subject to records we must legally retain.
        </p>
      </PolicySection>

      <PolicySection heading="Your choices">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Ask for a copy of the personal data we hold about you.</li>
          <li>Ask us to correct anything that&apos;s wrong.</li>
          <li>Ask us to delete your account and associated data.</li>
          <li>Unsubscribe from any promotional messages.</li>
        </ul>
        <p>
          Write to{" "}
          <a href={`mailto:${BUSINESS.email}`} className="text-volt underline underline-offset-2">
            {BUSINESS.email}
          </a>{" "}
          and we&apos;ll action it.
        </p>
      </PolicySection>

      <PolicySection heading="Security">
        <p>
          The site is served over HTTPS, and access to order data is restricted to authorised staff.
          No system is perfectly secure, but we take reasonable steps to protect your information.
        </p>
      </PolicySection>

      <PolicySection heading="Children">
        <p>
          Our store is not intended for children under 18. We don&apos;t knowingly collect their
          information.
        </p>
      </PolicySection>

      <PolicySection heading="Changes & contact">
        <p>
          We may update this policy as the store evolves; the latest version always lives on this
          page. Questions about privacy? Contact us at{" "}
          <a href={`mailto:${BUSINESS.email}`} className="text-volt underline underline-offset-2">
            {BUSINESS.email}
          </a>
          .
        </p>
      </PolicySection>
    </PageShell>
  );
}
