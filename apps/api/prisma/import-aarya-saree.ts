/**
 * Import the HYRALUXE Aarya saree as one product with six colour variants.
 *
 * Source photos are read from C:\Users\sagar\OneDrive\Pictures\branded.
 * Run: `npm run db:import:aarya-saree`
 */
import { Badge, Fit, Gender, PrismaClient, ProductStatus, Size } from '@prisma/client';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { extname, join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const SLUG =
  'hyraluxe-designer-shimmer-silk-saree-heavy-embroidered-border-wedding-party-wear';
const NAME = 'Aarya Luxe Premium Fancy Fabric Saree';
const PRICE_RUPEES = 1599;
const STOCK_PER_COLOUR = 2;
const SOURCE_DIR = 'C:\\Users\\sagar\\OneDrive\\Pictures\\branded';

const description =
  'HYRALUXE presents the Aarya Premium Fancy Fabric Saree, an elegant occasion-ready design featuring beautifully placed multicolor ethnic motifs and a rich intricately detailed designer border. Crafted in premium fancy fabric with a graceful lustrous finish, the saree creates a refined and luxurious traditional look. The coordinated pallu and detailed border enhance the overall drape, making it an ideal choice for weddings, receptions, festive celebrations, parties, engagements and family functions. Available in a curated range of sophisticated colours, Aarya is designed for women who appreciate timeless ethnic elegance with a contemporary luxury touch. The stitched blouse shown on the model is for styling reference only; the product includes an unstitched matching blouse piece.';

interface Colourway {
  name: string;
  slug: string;
  hex: string;
  sku: string;
  files: string[];
}

const colourways: Colourway[] = [
  {
    name: 'Royal Lavender',
    slug: 'royal-lavender',
    hex: '#6E4AA0',
    sku: 'HYL-AARYA-LAV-01',
    files: ['1.jpeg', '2.jpeg', '3.jpeg'],
  },
  {
    name: 'Jewel Teal',
    slug: 'jewel-teal',
    hex: '#168F88',
    sku: 'HYL-AARYA-TEAL-02',
    files: ['4.jpeg', '6.jpeg', '7.jpeg'],
  },
  {
    name: 'Heritage Olive',
    slug: 'heritage-olive',
    hex: '#6F7D32',
    sku: 'HYL-AARYA-OLV-03',
    files: ['8.jpeg', '9.jpeg', '10.jpeg'],
  },
  {
    name: 'Antique Mustard Gold',
    slug: 'antique-mustard-gold',
    hex: '#A58321',
    sku: 'HYL-AARYA-MUS-04',
    files: ['11.jpeg', '12.jpeg', '13.jpeg'],
  },
  {
    name: 'Dusty Rose',
    slug: 'dusty-rose',
    hex: '#A65B75',
    sku: 'HYL-AARYA-ROSE-05',
    files: ['14.jpeg', '15.jpeg', '16.jpeg'],
  },
  {
    name: 'Terracotta Peach',
    slug: 'terracotta-peach',
    hex: '#B86A52',
    sku: 'HYL-AARYA-TER-06',
    files: ['17.jpeg', '18.jpeg', '19.jpeg'],
  },
];

const toPaise = (rupees: number) => Math.round(rupees * 100);

function r2Client(): { client: S3Client; bucket: string; publicUrl: string } {
  const bucket = process.env.R2_BUCKET ?? '';
  const publicUrl = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!bucket || !publicUrl || !endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 env not fully configured.');
  }
  return {
    client: new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    }),
    bucket,
    publicUrl,
  };
}

function imagePath(file: string): string {
  const fullPath = join(SOURCE_DIR, file);
  if (!existsSync(fullPath)) throw new Error(`Missing image: ${fullPath}`);
  return fullPath;
}

function mimeFor(file: string): string {
  const ext = extname(file).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

async function uploadToR2(
  file: string,
  colour: Colourway,
  index: number,
  r2: ReturnType<typeof r2Client>,
): Promise<string> {
  const localPath = imagePath(file);
  const body = readFileSync(localPath);
  if (body.length < 1024) throw new Error(`Suspiciously small image: ${localPath}`);

  const baseName = file.slice(0, file.lastIndexOf('.')) || file;
  const key = `products/${SLUG}/${colour.slug}-${String(index + 1).padStart(2, '0')}-${baseName}-${randomBytes(3).toString('hex')}.jpg`;

  await r2.client.send(
    new PutObjectCommand({
      Bucket: r2.bucket,
      Key: key,
      Body: body,
      ContentType: mimeFor(file),
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );

  return `${r2.publicUrl}/${key}`;
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

async function upsertProduct(categoryId: string): Promise<string> {
  const shared = {
    name: NAME,
    description,
    brand: 'HyraLuxe',
    gender: Gender.WOMEN,
    fit: Fit.REGULAR,
    fabric: 'Fancy Fabric',
    status: ProductStatus.PUBLISHED,
    mrp: toPaise(PRICE_RUPEES),
    price: toPaise(PRICE_RUPEES),
    categoryId,
    badges: [Badge.NEW],
    isNewArrival: true,
    isTrending: true,
    blouseDetails: 'Matching unstitched blouse piece included',
    washCare: 'Dry clean recommended. Store in a dry place.',
    occasion: 'Wedding, Reception, Party, Festival, Engagement, Family Function',
    transparency: 'Semi-opaque appearance',
    metaTitle: 'Premium Fancy Fabric Saree with Designer Border | HYRALUXE',
    metaDescription:
      'Shop the HYRALUXE Aarya Premium Fancy Fabric Saree featuring multicolor ethnic motifs, rich designer border and elegant lustrous finish.',
  };

  const product = await prisma.product.upsert({
    where: { slug: SLUG },
    update: shared,
    create: { ...shared, slug: SLUG },
    select: { id: true },
  });

  for (const colour of colourways) {
    await prisma.productVariant.upsert({
      where: { sku: colour.sku },
      update: {
        productId: product.id,
        size: Size.FREE_SIZE,
        color: colour.name,
        colorHex: colour.hex,
        stock: STOCK_PER_COLOUR,
      },
      create: {
        productId: product.id,
        sku: colour.sku,
        size: Size.FREE_SIZE,
        color: colour.name,
        colorHex: colour.hex,
        stock: STOCK_PER_COLOUR,
      },
    });
  }

  return product.id;
}

async function replaceImages(productId: string): Promise<void> {
  const rows: {
    url: string;
    alt: string;
    color: string;
    sortOrder: number;
    isPrimary: boolean;
  }[] = [];
  let sortOrder = 0;
  const r2 = r2Client();

  for (const colour of colourways) {
    for (const [index, file] of colour.files.entries()) {
      const url = await uploadToR2(file, colour, index, r2);
      rows.push({
        url,
        alt: `${NAME} - ${colour.name}`,
        color: colour.name,
        sortOrder: sortOrder++,
        isPrimary: index === 0,
      });
      console.log(`  uploaded ${colour.name}/${file}`);
    }
  }

  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId } }),
    prisma.productImage.createMany({
      data: rows.map((row) => ({ ...row, productId })),
    }),
  ]);

  console.log(`Replaced images: ${rows.length} across ${colourways.length} colours.`);
}

async function main(): Promise<void> {
  for (const colour of colourways) {
    colour.files.forEach(imagePath);
  }
  const categoryId = await ensureSareeCategory();
  const productId = await upsertProduct(categoryId);
  await replaceImages(productId);
  console.log(`${NAME}: Rs ${PRICE_RUPEES}, ${STOCK_PER_COLOUR} pcs per colour, PUBLISHED`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
