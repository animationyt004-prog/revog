/**
 * Import the ready-to-wear stitched blouse listing.
 *
 * Images are hosted first with:
 *   npx ts-node prisma/host-saree-images.ts stitched-shimmer-blouse women-shimmer-ready-to-wear-stitched-blouse
 *
 * Run:
 *   npx ts-node prisma/import-stitched-blouse.ts
 */
import { Badge, Fit, Gender, PrismaClient, ProductStatus, Size } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const ASSETS_DIR = join(__dirname, 'assets', 'stitched-shimmer-blouse');
const PRODUCT_SLUG = 'women-shimmer-ready-to-wear-stitched-blouse';
const PRODUCT_NAME = 'Women Shimmer Ready-to-Wear Stitched Blouse';
const PRICE_RUPEES = 1299;
const STOCK_PER_COLOUR = 2;

const colours = [
  { folder: 'sage-green', name: 'Sage Green', hex: '#A8B58D' },
  { folder: 'dusty-mauve', name: 'Dusty Mauve', hex: '#B07B8C' },
  { folder: 'purple', name: 'Purple', hex: '#7B4A7A' },
  { folder: 'mustard-gold', name: 'Mustard Gold', hex: '#B87913' },
  { folder: 'olive-green', name: 'Olive Green', hex: '#556B2F' },
];

type HostedImages = Record<string, { file: string; url: string }[]>;

const toPaise = (rupees: number) => Math.round(rupees * 100);

function skuFor(folder: string): string {
  return `HF-BLS-01-${folder.toUpperCase().replace(/-/g, '')}`;
}

function hostedImages(): HostedImages {
  return JSON.parse(readFileSync(join(ASSETS_DIR, 'hosted-images.json'), 'utf8'));
}

async function ensureBlouseCategory(image?: string): Promise<string> {
  const parent = await prisma.category.upsert({
    where: { slug: 'women' },
    update: {},
    create: {
      name: 'Women',
      slug: 'women',
      description: 'Premium ethnic fashion for women.',
      sortOrder: 10,
    },
  });

  const category = await prisma.category.upsert({
    where: { slug: 'stitched-blouses' },
    update: {
      parentId: parent.id,
      image,
      description: 'Ready-to-wear stitched blouses for sarees, lehengas and festive looks.',
    },
    create: {
      name: 'Stitched Blouses',
      slug: 'stitched-blouses',
      description: 'Ready-to-wear stitched blouses for sarees, lehengas and festive looks.',
      image,
      parentId: parent.id,
      sortOrder: 12,
    },
  });

  return category.id;
}

async function main(): Promise<void> {
  const hosted = hostedImages();
  const firstImage = hosted['sage-green']?.[0]?.url;
  const categoryId = await ensureBlouseCategory(firstImage);

  const description =
    'Ready-to-wear stitched blouse in shimmer fabric with embroidered border detailing, half sleeves and a back tie-up dori. ' +
    'Designed to pair with sarees and lehengas for festive, wedding and party occasions. Price is for one blouse only; saree and accessories shown in photos are for styling.';

  const product = await prisma.product.upsert({
    where: { slug: PRODUCT_SLUG },
    update: {
      name: PRODUCT_NAME,
      description,
      brand: 'HyraLuxe',
      gender: Gender.WOMEN,
      fit: Fit.REGULAR,
      fabric: 'Silk Shimmer Blend',
      status: ProductStatus.PUBLISHED,
      mrp: toPaise(PRICE_RUPEES),
      price: toPaise(PRICE_RUPEES),
      categoryId,
      badges: [Badge.NEW],
      isNewArrival: true,
      blouseDetails: 'Ready-to-wear stitched blouse (blouse only)',
      washCare: 'Dry clean only. Do not bleach.',
      occasion: 'Festive, Wedding, Party',
      transparency: 'Opaque',
      metaTitle: `${PRODUCT_NAME} | HyraLuxe`,
      metaDescription: description.slice(0, 155),
    },
    create: {
      slug: PRODUCT_SLUG,
      name: PRODUCT_NAME,
      description,
      brand: 'HyraLuxe',
      gender: Gender.WOMEN,
      fit: Fit.REGULAR,
      fabric: 'Silk Shimmer Blend',
      status: ProductStatus.PUBLISHED,
      mrp: toPaise(PRICE_RUPEES),
      price: toPaise(PRICE_RUPEES),
      categoryId,
      badges: [Badge.NEW],
      isNewArrival: true,
      blouseDetails: 'Ready-to-wear stitched blouse (blouse only)',
      washCare: 'Dry clean only. Do not bleach.',
      occasion: 'Festive, Wedding, Party',
      transparency: 'Opaque',
      metaTitle: `${PRODUCT_NAME} | HyraLuxe`,
      metaDescription: description.slice(0, 155),
    },
    select: { id: true },
  });

  for (const colour of colours) {
    await prisma.productVariant.upsert({
      where: { sku: skuFor(colour.folder) },
      update: {
        productId: product.id,
        size: Size.FREE_SIZE,
        color: colour.name,
        colorHex: colour.hex,
        stock: STOCK_PER_COLOUR,
      },
      create: {
        productId: product.id,
        sku: skuFor(colour.folder),
        size: Size.FREE_SIZE,
        color: colour.name,
        colorHex: colour.hex,
        stock: STOCK_PER_COLOUR,
      },
    });
  }

  const rows: { url: string; alt: string; color: string; sortOrder: number; isPrimary: boolean }[] = [];
  let sortOrder = 0;

  for (const colour of colours) {
    const entries = hosted[colour.folder] ?? [];
    if (!entries.length) throw new Error(`No hosted images for ${colour.folder}`);

    entries.forEach((entry, index) => {
      rows.push({
        url: entry.url,
        alt: `${PRODUCT_NAME} - ${colour.name}`,
        color: colour.name,
        sortOrder: sortOrder++,
        isPrimary: index === 0,
      });
    });
  }

  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId: product.id } }),
    prisma.productImage.createMany({ data: rows.map((row) => ({ ...row, productId: product.id })) }),
  ]);

  console.log(
    `${PRODUCT_NAME}\n  ${colours.length} colours, ${rows.length} images, Rs ${PRICE_RUPEES}, ${STOCK_PER_COLOUR} pcs per colour, PUBLISHED`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
