/**
 * Give each Apple Saree variant a swatch colour sampled from its own photo.
 *
 * Every saree was seeded with the same maroon hex (#8A1538), so the storefront
 * showed an identical colour dot on every card. Here we pull each product's
 * primary (R2-hosted) image, compute its dominant colour with sharp, and store
 * that as the variant's colorHex — so the dot actually matches the saree.
 *
 * Run: `npm run db:fix:apple-saree-colors`
 */
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';

const prisma = new PrismaClient();

const toHex = (n: number): string => n.toString(16).padStart(2, '0');

/** Dominant colour of an image, as #rrggbb. */
async function dominantHex(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const { dominant } = await sharp(buf).stats();
  return `#${toHex(dominant.r)}${toHex(dominant.g)}${toHex(dominant.b)}`.toUpperCase();
}

async function main(): Promise<void> {
  const products = await prisma.product.findMany({
    where: { slug: { startsWith: 'apple-' } },
    select: {
      id: true,
      name: true,
      images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
    },
  });

  let ok = 0;
  let failed = 0;
  for (const p of products) {
    const url = p.images[0]?.url;
    if (!url) {
      console.log(`SKIP (no image): ${p.name}`);
      failed++;
      continue;
    }
    try {
      const hex = await dominantHex(url);
      const updated = await prisma.productVariant.updateMany({
        where: { productId: p.id },
        data: { colorHex: hex },
      });
      console.log(`OK  ${p.name.slice(0, 44).padEnd(46)} -> ${hex} (${updated.count} variant)`);
      ok++;
    } catch (err) {
      console.log(`FAIL ${p.name}: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\nDone. updated=${ok} failed=${failed}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
