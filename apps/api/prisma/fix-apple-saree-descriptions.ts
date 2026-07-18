/**
 * Replace the placeholder Apple Saree descriptions (which leaked wholesale cost
 * and markup) with original, customer-facing selling copy + SEO meta.
 *
 * Run: `npm run db:fix:apple-saree-descriptions`
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Copy {
  description: string;
  metaDescription: string;
}

// Original marketing copy per saree — no cost/markup mentioned.
const copyBySlug: Record<string, Copy> = {
  'apple-feelmax-vol-1-printed-japan-satin-saree': {
    description:
      'A soft Japan-satin saree with a fluid, glossy drape and a vibrant multicolour print framed by a bold contrast border. Lightweight and easy to carry all day, it moves from a festive lunch to an evening out without a second thought. Comes with a matching unstitched blouse piece.',
    metaDescription:
      'Printed Japan satin saree with a glossy drape and contrast border. Lightweight, festive-ready, with matching blouse piece. Shop REVOG.',
  },
  'apple-harmony-vol-2-organza-printed-designer-saree': {
    description:
      'A sheer sky-blue organza saree with a delicate floral print and a crisp, airy fall. The lightly structured organza holds its shape beautifully, making it a graceful pick for daytime functions, sangeets and pujas. Includes a matching unstitched blouse piece.',
    metaDescription:
      'Sky-blue printed organza designer saree with a crisp floral drape and matching blouse piece. Perfect for daytime functions. Shop REVOG.',
  },
  'apple-laila-vol-1-organza-digital-printed-saree-collection': {
    description:
      'An elegant organza saree in warm beige tones, finished with a fine digital print that catches the light. Featherlight and fuss-free to drape, it is made for long celebrations where you still want to feel effortless. Comes with a matching unstitched blouse piece.',
    metaDescription:
      'Beige digital-printed organza saree — featherlight, elegant, easy to drape, with matching blouse piece. Shop the Laila collection at REVOG.',
  },
  'apple-womaniya-34-bhagalpuri-silk-printed-saree-collection': {
    description:
      'A rich Bhagalpuri silk saree in deep maroon with an intricate traditional print. The soft silk texture drapes smoothly and feels premium without the weight, ideal for festive days and family gatherings. Includes a matching unstitched blouse piece.',
    metaDescription:
      'Deep maroon Bhagalpuri silk printed saree with a smooth premium drape and matching blouse piece. Festive-ready. Shop REVOG.',
  },
  'apple-womaniya-32-bhagalpuri-silk-printed-saree-collection': {
    description:
      'A soft Bhagalpuri silk saree in muted lavender-taupe with an all-over printed motif. Understated yet refined, it drapes lightly and works just as well for office festivities as for weekend celebrations. Comes with a matching unstitched blouse piece.',
    metaDescription:
      'Lavender-taupe Bhagalpuri silk printed saree — soft, refined, everyday-festive, with matching blouse piece. Shop REVOG.',
  },
  'apple-womaniya-35-traditional-wear-bhagalpuri-silk-saree-collection': {
    description:
      'A traditional Bhagalpuri silk saree in deep navy with a classic printed pattern and a clean border. The smooth silk fall makes it easy to drape and comfortable to wear through long ceremonies. Includes a matching unstitched blouse piece.',
    metaDescription:
      'Navy traditional Bhagalpuri silk saree with a classic print and matching blouse piece. Comfortable, ceremony-ready. Shop REVOG.',
  },
  'apple-nitya-silk-12-bhagalpuri-silk-printed-saree-collection': {
    description:
      'A striking Bhagalpuri silk saree in navy with warm printed detailing that adds a festive glow. Soft to the touch with a graceful drape, it is a dependable choice for pujas, functions and evening events. Comes with a matching unstitched blouse piece.',
    metaDescription:
      'Navy Bhagalpuri silk printed saree with a festive glow and matching blouse piece. Soft, graceful drape. Shop the Nitya collection at REVOG.',
  },
  'apple-womaniya-vol-28-bhagalpuri-printed-silk-saree-collection': {
    description:
      'A Bhagalpuri silk saree in royal blue with a crisp white printed motif and defined border. Lightweight yet rich-looking, it is an easy way to look put-together at any celebration. Includes a matching unstitched blouse piece.',
    metaDescription:
      'Royal-blue Bhagalpuri silk printed saree with white motifs and matching blouse piece. Lightweight, celebration-ready. Shop REVOG.',
  },
  'apple-indigo-vol-2-printed-bhagalpuri-silk-saree-collection': {
    description:
      'An indigo-inspired Bhagalpuri silk saree in royal blue, printed with clean white patterns for a fresh, contemporary look. The soft silk drapes smoothly and carries comfortably from morning functions to evening gatherings. Comes with a matching unstitched blouse piece.',
    metaDescription:
      'Royal-blue indigo-print Bhagalpuri silk saree — fresh, contemporary, soft drape, with matching blouse piece. Shop REVOG.',
  },
  'apple-3-gorgeous-party-wear-georgette-saree-collection': {
    description:
      'A gorgeous party-wear georgette saree in deep wine, with a flowing drape and a subtle sheen that stands out under evening light. Soft and easy to carry, it is styled for receptions, parties and special nights out. Includes a matching unstitched blouse piece.',
    metaDescription:
      'Wine party-wear georgette saree with a flowing drape and subtle sheen, plus matching blouse piece. Made for evenings. Shop REVOG.',
  },
};

async function main(): Promise<void> {
  let ok = 0;
  let failed = 0;
  for (const [slug, copy] of Object.entries(copyBySlug)) {
    const product = await prisma.product.findUnique({ where: { slug }, select: { id: true, name: true } });
    if (!product) {
      console.log(`SKIP (no product): ${slug}`);
      failed++;
      continue;
    }
    await prisma.product.update({
      where: { id: product.id },
      data: {
        description: copy.description,
        metaDescription: copy.metaDescription.slice(0, 160),
      },
    });
    console.log(`OK  ${product.name}`);
    ok++;
  }
  console.log(`\nDone. updated=${ok} failed=${failed}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
