import type { Metadata } from "next";
import { PageShell, PolicySection } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "About REVOG",
  description:
    "REVOG is an India-based online store for festive sarees — curated fabrics, honest pricing, Cash on Delivery and easy 7-day returns.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <PageShell
      title="About REVOG"
      accent="."
      intro="Festive Indian fashion, curated and delivered across the country."
    >
      <PolicySection heading="Who we are">
        <p>
          REVOG is an India-based online store for women&apos;s festive wear. We started with a
          simple idea: buying a good saree online should be straightforward — clear photos, an
          honest description of the fabric, a price without games, and the option to pay only when
          the parcel reaches your door.
        </p>
      </PolicySection>

      <PolicySection heading="What we sell">
        <p>
          Our current edit focuses on sarees — organza, Bhagalpuri silk, georgette, satin and net —
          chosen for how they drape and how comfortable they are to wear through a long function.
          Every saree ships with an unstitched blouse piece so you can tailor it to your own fit.
        </p>
        <p>
          We describe each piece as accurately as we can, including when the styled blouse in a
          photo is only for reference. If something isn&apos;t what you expected, our returns policy
          is there for exactly that reason.
        </p>
      </PolicySection>

      <PolicySection heading="How we work">
        <p>
          We source from established wholesale markets and sell directly to you, which keeps prices
          reasonable without cutting corners on the fabric. Orders are packed and dispatched
          quickly, and you can track everything from your order confirmation.
        </p>
      </PolicySection>

      <PolicySection heading="Our promises">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Cash on Delivery available across serviceable pincodes in India.</li>
          <li>Free shipping on orders above ₹999.</li>
          <li>Easy 7-day returns if a piece isn&apos;t right for you.</li>
          <li>Real photos and honest fabric descriptions — no misleading claims.</li>
        </ul>
      </PolicySection>

      <PolicySection heading="Talk to us">
        <p>
          Questions about a saree, your order, or a return? Our{" "}
          <a href="/contact" className="text-volt underline underline-offset-2">
            contact page
          </a>{" "}
          has every way to reach us — we usually reply the same day.
        </p>
      </PolicySection>
    </PageShell>
  );
}
