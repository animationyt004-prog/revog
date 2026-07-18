/**
 * Host Apple Saree catalog images on our own Cloudflare R2 bucket.
 *
 * Each product gets its OWN distinct hero shot (sourced from the matching
 * textileexport product page's og:image). We download once, upload to R2 —
 * so we never hot-link the supplier CDN (no bandwidth theft, links never
 * break) — then point the product's primary image at the R2 URL.
 *
 * Run once: `npm run db:host:apple-saree-images`
 */
import { PrismaClient } from '@prisma/client';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Distinct supplier source photo per product slug (one image per saree).
const imageBySlug: Record<string, string> = {
  'apple-feelmax-vol-1-printed-japan-satin-saree':
    'https://textile-export.b-cdn.net/images/800/168654583850485190-106.jpg',
  'apple-harmony-vol-2-organza-printed-designer-saree':
    'https://imgbook.textileexport.in/imgbook/product/o/20260211/1770807224177039552.jpeg',
  'apple-laila-vol-1-organza-digital-printed-saree-collection':
    'https://textile-export.b-cdn.net/images/800/20251114/1763106634466551795.jpeg',
  'apple-womaniya-34-bhagalpuri-silk-printed-saree-collection':
    'https://textile-export.b-cdn.net/images/800/20250613/17498183891775626129.jpeg',
  'apple-womaniya-32-bhagalpuri-silk-printed-saree-collection':
    'https://textile-export.b-cdn.net/images/800/1720181761944575466-32WOM32908.jpg',
  'apple-womaniya-35-traditional-wear-bhagalpuri-silk-saree-collection':
    'https://textile-export.b-cdn.net/images/800/20250616/17500659611667374900.jpeg',
  'apple-nitya-silk-12-bhagalpuri-silk-printed-saree-collection':
    'https://textile-export.b-cdn.net/images/800/17175647241006238711-12NTYA1204.jpg',
  'apple-womaniya-vol-28-bhagalpuri-printed-silk-saree-collection':
    'https://textile-export.b-cdn.net/images/800/16962249411397683025-28WOM28905jpg.jpg',
  'apple-indigo-vol-2-printed-bhagalpuri-silk-saree-collection':
    'https://textile-export.b-cdn.net/images/800/16849050921269459668-WhatsApp Image 2023-05-20 at 16.52.28.jpeg',
  'apple-3-gorgeous-party-wear-georgette-saree-collection':
    'https://textile-export.b-cdn.net/images/800/20250108/17363376481731218659-WhatsApp Image 2024-12-27 at 17.36.04 (1).jpeg',
};

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

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

/** Download a supplier image and push it to R2, returning the public R2 URL. */
async function mirrorToR2(sourceUrl: string, r2: ReturnType<typeof r2Client>): Promise<string> {
  // Some source URLs contain spaces / parens — encode the path safely.
  const safeUrl = encodeURI(sourceUrl);
  const res = await fetch(safeUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
    },
  });
  if (!res.ok) throw new Error(`fetch ${res.status} for ${sourceUrl}`);

  const contentType = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  const mime = ALLOWED.has(contentType) ? contentType : 'image/jpeg';
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 1024) throw new Error(`suspiciously small (${buffer.length}B): ${sourceUrl}`);

  const ext = mime.split('/')[1].replace('jpeg', 'jpg');
  const key = `products/apple-sarees/${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`;
  await r2.client.send(
    new PutObjectCommand({
      Bucket: r2.bucket,
      Key: key,
      Body: buffer,
      ContentType: mime,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  return `${r2.publicUrl}/${key}`;
}

async function main(): Promise<void> {
  const r2 = r2Client();

  // Guard against silently re-introducing duplicates.
  const uniqueSources = new Set(Object.values(imageBySlug));
  if (uniqueSources.size !== Object.keys(imageBySlug).length) {
    throw new Error(`Source list has duplicate image URLs (${uniqueSources.size} unique of ${Object.keys(imageBySlug).length}).`);
  }

  let ok = 0;
  let failed = 0;
  for (const [slug, sourceUrl] of Object.entries(imageBySlug)) {
    const product = await prisma.product.findUnique({ where: { slug }, select: { id: true, name: true } });
    if (!product) {
      console.log(`SKIP (no product): ${slug}`);
      failed++;
      continue;
    }
    try {
      const r2Url = await mirrorToR2(sourceUrl, r2);
      await prisma.$transaction([
        prisma.productImage.deleteMany({ where: { productId: product.id } }),
        prisma.productImage.create({
          data: {
            productId: product.id,
            url: r2Url,
            alt: product.name,
            color: 'Assorted',
            sortOrder: 0,
            isPrimary: true,
          },
        }),
      ]);
      console.log(`OK  ${product.name}`);
      ok++;
    } catch (err) {
      console.log(`FAIL ${slug}: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\nDone. hosted=${ok} failed=${failed}, unique sources=${uniqueSources.size}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
