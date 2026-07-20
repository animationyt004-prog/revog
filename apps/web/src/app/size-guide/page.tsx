import type { Metadata } from "next";
import { PageShell, PolicySection } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "Size Guide",
  description:
    "REVOG size guide — saree and blouse-piece measurements, plus garment-flat charts in inches for tops and bottoms.",
  alternates: { canonical: "/size-guide" },
};

/** Garment-flat measurements in inches (same source as the on-product modal). */
const TOPS: [string, number, number, number][] = [
  ["S", 40, 27, 19],
  ["M", 42, 28, 20],
  ["L", 44, 29, 21],
  ["XL", 46, 30, 22],
  ["XXL", 48, 31, 23],
];

const BOTTOMS: [string, number, number, number][] = [
  ["S", 30, 39, 11],
  ["M", 32, 40, 11.5],
  ["L", 34, 41, 12],
  ["XL", 36, 42, 12.5],
  ["XXL", 38, 43, 13],
];

function Chart({
  rows,
  headers,
}: {
  rows: [string, number, number, number][];
  headers: [string, string, string, string];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[380px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-paper/15 text-paper">
            {headers.map((h) => (
              <th key={h} className="py-2 pr-4 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([size, a, b, c]) => (
            <tr key={size} className="border-b border-paper/5 last:border-0">
              <td className="py-2 pr-4 font-semibold text-paper">{size}</td>
              <td className="py-2 pr-4">{a}&quot;</td>
              <td className="py-2 pr-4">{b}&quot;</td>
              <td className="py-2 pr-4">{c}&quot;</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SizeGuidePage() {
  return (
    <PageShell
      title="Size Guide"
      accent="."
      intro="Sarees are free size. For everything else, here are our garment-flat measurements."
    >
      <PolicySection heading="Sarees — Free Size">
        <p>
          Sarees are one-size and drape to fit most body types, so there&apos;s no size to choose at
          checkout. Typical measurements:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Saree length:</strong> about 5.5 metres (approx. 6.3 yards).
          </li>
          <li>
            <strong>Saree width:</strong> about 1.06 metres (approx. 42 inches).
          </li>
          <li>
            <strong>Blouse piece:</strong> about 0.8 metres of matching unstitched fabric, included
            with every saree.
          </li>
        </ul>
        <p>
          The blouse piece is <strong>unstitched</strong> — get it tailored to your own fit. Any
          styled blouse worn by the model in our photos is for reference only.
        </p>
      </PolicySection>

      <PolicySection heading="Tops (tees, shirts, hoodies)">
        <p>Measured flat across the garment, in inches. Allow ±0.5&quot; for stitching.</p>
        <Chart rows={TOPS} headers={["Size", "Chest", "Length", "Shoulder"]} />
      </PolicySection>

      <PolicySection heading="Bottoms (cargos, joggers)">
        <p>Measured flat, in inches.</p>
        <Chart rows={BOTTOMS} headers={["Size", "Waist", "Length", "Thigh"]} />
      </PolicySection>

      <PolicySection heading="How to measure">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Chest:</strong> lay a similar garment flat and measure across, just under the
            armholes — then double it.
          </li>
          <li>
            <strong>Length:</strong> from the highest point of the shoulder straight down to the hem.
          </li>
          <li>
            <strong>Waist:</strong> across the top of the waistband, doubled.
          </li>
        </ul>
        <p>
          Easiest method: measure a garment you already own and love the fit of, then match it to the
          chart.
        </p>
      </PolicySection>

      <PolicySection heading="Between two sizes?">
        <p>
          Our tops are cut relaxed/oversized, so go with the smaller size if you want a regular fit,
          and the larger one for a roomier look. Still unsure? Message us from the{" "}
          <a href="/contact" className="text-volt underline underline-offset-2">
            contact page
          </a>{" "}
          — tell us your usual size and we&apos;ll recommend one.
        </p>
      </PolicySection>
    </PageShell>
  );
}
