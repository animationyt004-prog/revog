/**
 * Import the zari embroidered georgette saree with scalloped border.
 *
 * Images are hosted first with:
 *   npx ts-node prisma/host-saree-images.ts zari-embroidered-georgette-saree women-zari-embroidered-georgette-saree-scalloped-border
 *
 * Run:
 *   npx ts-node prisma/import-zari-embroidered-georgette-saree.ts
 */
import { Badge, Fit, Gender, PrismaClient, ProductStatus, Size } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const ASSETS_DIR = join(__dirname, 'assets', 'zari-embroidered-georgette-saree');
const PRODUCT_SLUG = 'women-zari-embroidered-georgette-saree-scalloped-border';
const PRODUCT_NAME =
  'Women Zari Embroidered Georgette Saree with Scalloped Border & Matching Blouse';
const SKU_PREFIX = 'HF-ZEB-01';
const PRICE_RUPEES = 1299;
const STOCK_PER_COLOUR = 2;

const colours = [
  { folder: 'bottle-green', name: 'Bottle Green', hex: '#1E4620' },
  { folder: 'red', name: 'Red', hex: '#E01B34' },
  { folder: 'maroon', name: 'Maroon', hex: '#6E1329' },
  { folder: 'mustard-yellow', name: 'Mustard Yellow', hex: '#E8A509' },
  { folder: 'peacock-blue', name: 'Peacock Blue', hex: '#0F4553' },
  { folder: 'teal-green', name: 'Teal Green', hex: '#0E6E66' },
];

type HostedImages = Record<string, { file: string; url: string }[]>;

const toPaise = (rupees: number) => Math.round(rupees * 100);

function skuFor(folder: string): string {
  return `${SKU_PREFIX}-${folder.toUpperCase().replace(/-/g, '')}`;
}

function hostedImages(): HostedImages {
  return JSON.parse(readFileSync(join(ASSETS_DIR, 'hosted-images.json'), 'utf8'));
}

async function ensureSareeCategory(image?: string): Promise<string> {
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

  const sarees = await prisma.category.upsert({
    where: { slug: 'sarees' },
    update: {
      parentId: parent.id,
      image,
      description: 'Curated premium sarees for festive, wedding and occasion wear.',
    },
    create: {
      name: 'Sarees',
      slug: 'sarees',
      description: 'Curated premium sarees for festive, wedding and occasion wear.',
      image,
      parentId: parent.id,
      sortOrder: 11,
    },
  });

  return sarees.id;
}

async function main(): Promise<void> {
  const hosted = hostedImages();
  const firstImage = hosted['bottle-green']?.[0]?.url;
  const categoryId = await ensureSareeCategory(firstImage);

  const description =
    'Festive georgette saree covered in fine zari chain lines running on the diagonal, with sequin-filled flower motifs scattered between them. ' +
    'The pallu and hem are finished with a broad scalloped embroidered border in gold, and a matching embroidered blouse piece comes with it. ' +
    'Soft, easy to pleat and light enough to carry through a long function. Made for weddings, sangeet, festive pujas and receptions.';

  const shared = {
    name: PRODUCT_NAME,
    description,
    brand: 'HyraLuxe',
    gender: Gender.WOMEN,
    fit: Fit.REGULAR,
    fabric: 'Georgette',
    status: ProductStatus.PUBLISHED,
    mrp: toPaise(PRICE_RUPEES),
    price: toPaise(PRICE_RUPEES),
    categoryId,
    badges: [Badge.NEW],
    isNewArrival: true,
    sareeLength: '5.5 m',
    blouseDetails: 'Unstitched embroidered blouse piece included (0.8 m)',
    washCare: 'Dry clean only. Do not bleach.',
    occasion: 'Festive, Wedding, Party',
    transparency: 'Opaque body, semi-sheer pallu',
    metaTitle: 'Women Zari Embroidered Georgette Saree with Scalloped Border | HYRA',
    metaDescription:
      'Shop zari embroidered georgette saree with diagonal chain lines, sequin flower motifs, scalloped gold border and unstitched blouse piece.',
  };

  const product = await prisma.product.upsert({
    where: { slug: PRODUCT_SLUG },
    update: shared,
    create: { ...shared, slug: PRODUCT_SLUG },
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
