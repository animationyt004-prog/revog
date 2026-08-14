/**
 * Import the floral printed organza saree with scalloped embroidered border.
 *
 * Images are hosted first with:
 *   npx ts-node prisma/host-saree-images.ts floral-printed-organza-saree women-floral-printed-organza-saree-scalloped-border
 *
 * Run:
 *   npx ts-node prisma/import-floral-printed-organza-saree.ts
 */
import { Badge, Fit, Gender, PrismaClient, ProductStatus, Size } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const ASSETS_DIR = join(__dirname, 'assets', 'floral-printed-organza-saree');
const PRODUCT_SLUG = 'women-floral-printed-organza-saree-scalloped-border';
const PRODUCT_NAME = 'Women Floral Printed Organza Saree with Scalloped Embroidered Border';
const SKU_PREFIX = 'HF-ORG-01';
const PRICE_RUPEES = 1999;
const STOCK_PER_COLOUR = 2;

const colours = [
  { folder: 'pista-green', name: 'Pista Green', hex: '#C7D191' },
  { folder: 'mint-green', name: 'Mint Green', hex: '#C3D2BC' },
  { folder: 'lilac', name: 'Lilac', hex: '#C0AEC4' },
  { folder: 'peach', name: 'Peach', hex: '#EFC3BC' },
  { folder: 'ivory', name: 'Ivory', hex: '#EDE9D8' },
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
  const firstImage = hosted['pista-green']?.[0]?.url;
  const categoryId = await ensureSareeCategory(firstImage);

  const description =
    'Lightweight organza saree in a soft tissue finish, digitally printed with a painterly floral garden that gathers into a bold bouquet pallu over a zig-zag band. ' +
    'The border is finished with fine scalloped cutwork embroidery and sequin detailing on all four sides. ' +
    'Comes with a matching unstitched blouse piece. Airy, easy to carry all evening and beautifully sheer in the light. ' +
    'Made for day functions, mehendi, receptions and festive get-togethers.';

  const shared = {
    name: PRODUCT_NAME,
    description,
    brand: 'HyraLuxe',
    gender: Gender.WOMEN,
    fit: Fit.REGULAR,
    fabric: 'Organza (tissue finish)',
    status: ProductStatus.PUBLISHED,
    mrp: toPaise(PRICE_RUPEES),
    price: toPaise(PRICE_RUPEES),
    categoryId,
    badges: [Badge.NEW],
    isNewArrival: true,
    sareeLength: '5.5 m',
    blouseDetails: 'Unstitched blouse piece included (0.8 m)',
    washCare: 'Dry clean only. Do not bleach.',
    occasion: 'Festive, Wedding, Party',
    transparency: 'Semi-sheer',
    metaTitle: 'Women Floral Printed Organza Saree with Scalloped Border | HYRA',
    metaDescription:
      'Shop lightweight semi-sheer organza saree with floral print, bouquet pallu, scalloped embroidered sequin border and matching blouse piece.',
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
