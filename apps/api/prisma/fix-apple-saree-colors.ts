/**
 * Set each Apple Saree variant's swatch colour to a hand-verified value that
 * matches the actual saree in its photo.
 *
 * An earlier attempt sampled the image's "dominant" colour, but catalog shots
 * have light/props backgrounds, so it picked the background instead of the
 * saree. These hexes were chosen by eye from each product's photo.
 *
 * Run: `npm run db:fix:apple-saree-colors`
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// slug -> { colour name, hex } verified against each saree photo.
const colourBySlug: Record<string, { name: string; hex: string }> = {
  'apple-3-gorgeous-party-wear-georgette-saree-collection': { name: 'Wine', hex: '#7C1F3A' },
  'apple-feelmax-vol-1-printed-japan-satin-saree': { name: 'Silver', hex: '#B9B2AD' },
  'apple-harmony-vol-2-organza-printed-designer-saree': { name: 'Sky Blue', hex: '#7FC1DE' },
  'apple-indigo-vol-2-printed-bhagalpuri-silk-saree-collection': { name: 'Royal Blue', hex: '#1F5FC0' },
  'apple-laila-vol-1-organza-digital-printed-saree-collection': { name: 'Beige', hex: '#C7A67B' },
  'apple-nitya-silk-12-bhagalpuri-silk-printed-saree-collection': { name: 'Navy', hex: '#1E3A6B' },
  'apple-womaniya-32-bhagalpuri-silk-printed-saree-collection': { name: 'Lavender', hex: '#9B7FC2' },
  'apple-womaniya-34-bhagalpuri-silk-printed-saree-collection': { name: 'Maroon', hex: '#5C2230' },
  'apple-womaniya-35-traditional-wear-bhagalpuri-silk-saree-collection': { name: 'Navy', hex: '#243F6B' },
  'apple-womaniya-vol-28-bhagalpuri-printed-silk-saree-collection': { name: 'Mustard', hex: '#C99A2E' },
};

async function main(): Promise<void> {
  let ok = 0;
  let failed = 0;
  for (const [slug, { name, hex }] of Object.entries(colourBySlug)) {
    const product = await prisma.product.findUnique({ where: { slug }, select: { id: true, name: true } });
    if (!product) {
      console.log(`SKIP (no product): ${slug}`);
      failed++;
      continue;
    }
    // Keep variant + image colour labels in sync so the product-page gallery
    // colour matching still lines up.
    const [updated] = await prisma.$transaction([
      prisma.productVariant.updateMany({ where: { productId: product.id }, data: { color: name, colorHex: hex } }),
      prisma.productImage.updateMany({ where: { productId: product.id }, data: { color: name } }),
    ]);
    console.log(`OK  ${product.name.slice(0, 44).padEnd(46)} -> ${name} ${hex} (${updated.count} variant)`);
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
