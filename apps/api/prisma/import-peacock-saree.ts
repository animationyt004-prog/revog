/**
 * Import the Peacock Digital Print saree (6 colourways) as ONE product with
 * one variant per colour, and host its photos on our own R2 bucket.
 *
 * Photos are read from `prisma/assets/peacock-saree/<colour-slug>/` — drop the
 * JPGs in there first, named so they sort the way you want them to appear
 * (01-main.jpg, 02-side.jpg, ...). The first file of each colour becomes that
 * colour's primary image; the first file of the first colour is the product
 * hero.
 *
 * Run: `npm run db:import:peacock-saree`
 * Safe to re-run — the product is upserted and images are replaced only when
 * local files are present.
 */
import { Badge, Fit, Gender, PrismaClient, ProductStatus, Size } from '@prisma/client';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { extname, join } from 'path';

const prisma = new PrismaClient();

const SLUG = 'women-designer-peacock-digital-print-saree-rhinestone-work';
const NAME = 'Women Designer Peacock Digital Print Saree with Rhinestone Diamond Work';
const STYLE_CODE = 'HF-PCK-01';
const MRP_RUPEES = 2499;
const PRICE_RUPEES = 1699;
const FABRIC = 'Cotton Silk';

const ASSETS_DIR = join(__dirname, 'assets', 'peacock-saree');
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

interface Colourway {
  /** Customer-facing colour name — also the Flipkart `Color` attribute. */
  name: string;
  /** Folder under ASSETS_DIR and the SKU suffix. */
  slug: string;
  hex: string;
  stock: number;
}

const colourways: Colourway[] = [
  { name: 'Beige', slug: 'beige', hex: '#C2A98A', stock: 10 },
  { name: 'Grey', slug: 'grey', hex: '#8A8C8F', stock: 10 },
  { name: 'Sea Green', slug: 'sea-green', hex: '#5FA79B', stock: 10 },
  { name: 'Wine', slug: 'wine', hex: '#9C5A78', stock: 10 },
  { name: 'Purple', slug: 'purple', hex: '#963A9E', stock: 10 },
  { name: 'Blue', slug: 'blue', hex: '#6B7A9E', stock: 10 },
];

const description =
  'Designer saree in soft cotton silk with an all-over peacock and floral digital print, ' +
  'finished with delicate rhinestone diamond work along the border and pallu. Comes with a ' +
  'matching unstitched blouse piece. Light in weight, easy to drape and comfortable for long ' +
  'wear — a graceful pick for weddings, festivals, receptions and family functions.';

const toPaise = (rupees: number) => Math.round(rupees * 100);
const skuFor = (c: Colourway) => `${STYLE_CODE}-${c.slug.toUpperCase().replace(/-/g, '')}`;

function r2Client(): { client: S3Client; bucket: string; publicUrl: string } {
  const bucket = process.env.R2_BUCKET ?? '';
  const publicUrl = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!bucket || !publicUrl || !endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 env not fully configured (need R2_BUCKET/ENDPOINT/ACCESS_KEY_ID/SECRET_ACCESS_KEY/PUBLIC_URL).');
  }
  return {
    client: new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId, secretAccessKey } }),
    bucket,
    publicUrl,
  };
}

function mimeFor(file: string): string {
  const ext = extname(file).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.avif') return 'image/avif';
  return 'image/jpeg';
}

async function uploadToR2(localPath: string, r2: ReturnType<typeof r2Client>): Promise<string> {
  const body = readFileSync(localPath);
  if (body.length < 1024) throw new Error(`suspiciously small (${body.length}B): ${localPath}`);
  const mime = mimeFor(localPath);
  if (!ALLOWED.has(mime)) throw new Error(`unsupported image type for ${localPath}`);

  const ext = mime.split('/')[1].replace('jpeg', 'jpg');
  const key = `products/${SLUG}/${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`;
  await r2.client.send(
    new PutObjectCommand({
      Bucket: r2.bucket,
      Key: key,
      Body: body,
      ContentType: mime,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  return `${r2.publicUrl}/${key}`;
}

/** Local photos for a colour, sorted by filename. */
function localPhotos(colour: Colourway): string[] {
  const dir = join(ASSETS_DIR, colour.slug);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => IMAGE_EXT.has(extname(f).toLowerCase()))
    .sort()
    .map((f) => join(dir, f));
}

async function ensureSareeCategory(): Promise<string> {
  const parent = await prisma.category.upsert({
    where: { slug: 'women' },
    update: {},
    create: { name: 'Women', slug: 'women', description: 'Premium ethnic fashion for women.', sortOrder: 10 },
  });

  const sarees = await prisma.category.upsert({
    where: { slug: 'sarees' },
    update: { parentId: parent.id },
    create: {
      name: 'Sarees',
      slug: 'sarees',
      description: 'Curated sarees with transparent reseller pricing.',
      parentId: parent.id,
      sortOrder: 11,
    },
  });

  return sarees.id;
}

async function upsertProduct(categoryId: string): Promise<string> {
  const shared = {
    name: NAME,
    brand: 'HyraLuxe',
    gender: Gender.WOMEN,
    fit: Fit.REGULAR,
    fabric: FABRIC,
    status: ProductStatus.PUBLISHED,
    mrp: toPaise(MRP_RUPEES),
    price: toPaise(PRICE_RUPEES),
    categoryId,
    badges: [Badge.NEW],
    isNewArrival: true,
    metaTitle: `${NAME} | HYRA`,
    metaDescription: description.slice(0, 155),
  };

  const product = await prisma.product.upsert({
    where: { slug: SLUG },
    update: shared,
    create: { ...shared, slug: SLUG, description },
    select: { id: true },
  });

  for (const colour of colourways) {
    await prisma.productVariant.upsert({
      where: { sku: skuFor(colour) },
      update: { stock: colour.stock, colorHex: colour.hex },
      create: {
        productId: product.id,
        sku: skuFor(colour),
        size: Size.FREE_SIZE,
        color: colour.name,
        colorHex: colour.hex,
        stock: colour.stock,
      },
    });
  }

  return product.id;
}

async function syncImages(productId: string): Promise<void> {
  const withPhotos = colourways.filter((c) => localPhotos(c).length > 0);
  if (withPhotos.length === 0) {
    console.log(`No photos found under ${ASSETS_DIR} — skipping image upload.`);
    return;
  }

  const r2 = r2Client();
  const rows: { url: string; alt: string; color: string; sortOrder: number; isPrimary: boolean }[] = [];
  let sortOrder = 0;

  for (const colour of withPhotos) {
    const files = localPhotos(colour);
    for (const [index, file] of files.entries()) {
      const url = await uploadToR2(file, r2);
      rows.push({
        url,
        alt: `${NAME} - ${colour.name}`,
        color: colour.name,
        sortOrder: sortOrder++,
        // First shot of each colour drives the swatch; the very first drives the card.
        isPrimary: index === 0,
      });
      console.log(`  uploaded ${colour.name}/${files.length > 0 ? index + 1 : 0} -> ${url}`);
    }
  }

  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId } }),
    prisma.productImage.createMany({ data: rows.map((r) => ({ ...r, productId })) }),
  ]);

  console.log(`Replaced images: ${rows.length} across ${withPhotos.length} colours.`);
}

async function main(): Promise<void> {
  const categoryId = await ensureSareeCategory();
  const productId = await upsertProduct(categoryId);
  console.log(`${NAME}\n  MRP Rs ${MRP_RUPEES} -> selling Rs ${PRICE_RUPEES}, ${colourways.length} colourways.`);
  await syncImages(productId);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
