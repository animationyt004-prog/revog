/**
 * Import the steel grey sequin-border saree with unstitched blouse piece.
 *
 * Images are hosted first with:
 *   npx ts-node prisma/host-saree-images.ts steel-grey-sequin-saree steel-grey-georgette-saree-sequin-striped-border-potli-tie-blouse
 *
 * Run:
 *   npx ts-node prisma/import-steel-grey-sequin-saree.ts
 */
import { Badge, Fit, Gender, PrismaClient, ProductStatus, Size } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const ASSETS_DIR = join(__dirname, 'assets', 'steel-grey-sequin-saree');
const PRODUCT_SLUG = 'steel-grey-georgette-saree-sequin-striped-border-potli-tie-blouse';
const PRODUCT_NAME =
  'Steel Grey Georgette Saree with Sequin Striped Border & Unstitched Blouse Piece';
const PRICE_RUPEES = 1599;
const STOCK = 7;
const COLOUR = { folder: 'steel-blue-grey', name: 'Steel Blue Grey', hex: '#4F5973' };

type HostedImages = Record<string, { file: string; url: string }[]>;

const toPaise = (rupees: number) => Math.round(rupees * 100);

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
  const images = hosted[COLOUR.folder] ?? [];
  if (!images.length) throw new Error(`No hosted images for ${COLOUR.folder}`);

  const categoryId = await ensureSareeCategory(images[0]?.url);

  const description =
    'A refined, minimalist steel blue-grey saree for the modern woman who loves understated glamour. ' +
    'Crafted in shimmer georgette and silk blend fabric, it has a subtle sheen with delicate gold sequin vertical stripe embroidery along the pallu and border. ' +
    'The clean linework catches evening light beautifully without heavy motifs. ' +
    'Comes with a matching unstitched blouse piece that can be tailored to your preferred fit and style. The blouse shown in photos is for styling reference. ' +
    'Perfect for cocktail parties, receptions, sangeet nights and evening events where you want elegance over embellishment. ' +
    'SEO tags: plain saree with embroidered border, sequin saree, designer blouse saree, reception wear saree, back tie-up blouse saree, party wear saree, minimal saree design.';

  const shared = {
    name: PRODUCT_NAME,
    description,
    brand: 'HyraLuxe',
    gender: Gender.WOMEN,
    fit: Fit.REGULAR,
    fabric: 'Shimmer Georgette / Silk Blend',
    status: ProductStatus.PUBLISHED,
    mrp: toPaise(PRICE_RUPEES),
    price: toPaise(PRICE_RUPEES),
    categoryId,
    badges: [Badge.NEW],
    isNewArrival: true,
    isTrending: true,
    sareeLength: 'Approx. 5.5 m saree with matching unstitched blouse piece',
    blouseDetails: 'Matching unstitched blouse piece included',
    washCare: 'Dry clean only.',
    occasion: 'Reception, Cocktail Party, Evening Wear, Sangeet, Party',
    transparency: 'Opaque',
    metaTitle:
      'Steel Grey Georgette Sequin Saree with Unstitched Blouse Piece | HyraLuxe',
    metaDescription:
      'Shop steel grey georgette saree with gold sequin striped border, pallu work and matching unstitched blouse piece for parties, receptions and sangeet.',
  };

  const product = await prisma.product.upsert({
    where: { slug: PRODUCT_SLUG },
    update: shared,
    create: { ...shared, slug: PRODUCT_SLUG },
    select: { id: true },
  });

  await prisma.productVariant.upsert({
    where: { sku: 'HF-SGS-01-STEELGREY' },
    update: {
      productId: product.id,
      size: Size.FREE_SIZE,
      color: COLOUR.name,
      colorHex: COLOUR.hex,
      stock: STOCK,
    },
    create: {
      productId: product.id,
      sku: 'HF-SGS-01-STEELGREY',
      size: Size.FREE_SIZE,
      color: COLOUR.name,
      colorHex: COLOUR.hex,
      stock: STOCK,
    },
  });

  const rows = images.map((entry, index) => ({
    url: entry.url,
    alt: `${PRODUCT_NAME} - ${COLOUR.name}`,
    color: COLOUR.name,
    sortOrder: index,
    isPrimary: index === 0,
  }));

  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId: product.id } }),
    prisma.productImage.createMany({ data: rows.map((row) => ({ ...row, productId: product.id })) }),
  ]);

  console.log(
    `${PRODUCT_NAME}\n  ${rows.length} images, Rs ${PRICE_RUPEES}, ${STOCK} pcs, PUBLISHED`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
