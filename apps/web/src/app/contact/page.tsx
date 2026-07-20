import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageShell, PolicySection } from "@/components/layout/page-shell";
import { BUSINESS, formattedAddress, formattedPhone, whatsappLink } from "@/lib/business";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Reach REVOG for order help, returns or product questions — WhatsApp, phone or email. We usually reply the same day.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <PageShell
      title="Contact Us"
      accent="."
      intro="Order help, returns, sizing or anything else — we're happy to help."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={whatsappLink("Hi REVOG! I have a question about my order.")}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 border border-paper/10 bg-ink-2 p-4 transition-colors hover:border-volt"
        >
          <MessageCircle size={18} className="mt-0.5 shrink-0 text-volt" />
          <span>
            <span className="block font-semibold text-paper">WhatsApp</span>
            <span className="text-xs">Fastest — chat with us</span>
          </span>
        </a>

        <a
          href={`mailto:${BUSINESS.email}`}
          className="flex items-start gap-3 border border-paper/10 bg-ink-2 p-4 transition-colors hover:border-volt"
        >
          <Mail size={18} className="mt-0.5 shrink-0 text-volt" />
          <span>
            <span className="block font-semibold text-paper">Email</span>
            <span className="text-xs break-all">{BUSINESS.email}</span>
          </span>
        </a>

        <a
          href={`tel:+${BUSINESS.phone}`}
          className="flex items-start gap-3 border border-paper/10 bg-ink-2 p-4 transition-colors hover:border-volt"
        >
          <Phone size={18} className="mt-0.5 shrink-0 text-volt" />
          <span>
            <span className="block font-semibold text-paper">Phone</span>
            <span className="text-xs">{formattedPhone()}</span>
          </span>
        </a>

        <div className="flex items-start gap-3 border border-paper/10 bg-ink-2 p-4">
          <Clock size={18} className="mt-0.5 shrink-0 text-volt" />
          <span>
            <span className="block font-semibold text-paper">Support hours</span>
            <span className="text-xs">{BUSINESS.hours}</span>
          </span>
        </div>
      </div>

      <PolicySection heading="Business address">
        <p className="flex items-start gap-2">
          <MapPin size={16} className="mt-0.5 shrink-0 text-volt" />
          <span>
            {BUSINESS.legalName}
            <br />
            {formattedAddress()}
          </span>
        </p>
      </PolicySection>

      <PolicySection heading="Order & return help">
        <p>
          For anything about an existing order, please include your <strong>order number</strong>{" "}
          (it&apos;s on your confirmation page and email) so we can help faster. Return requests can
          also be raised directly from your order page within{" "}
          {BUSINESS.policy.returnWindowDays} days of delivery — see our{" "}
          <a href="/policies/returns" className="text-volt underline underline-offset-2">
            returns policy
          </a>
          .
        </p>
      </PolicySection>

      <PolicySection heading="Response time">
        <p>
          We reply to WhatsApp and email during support hours, usually the same day. Messages
          received on Sundays or public holidays are answered on the next working day.
        </p>
      </PolicySection>
    </PageShell>
  );
}
