/**
 * Upload one design's colour photos to R2 and write its hosted-images.json.
 *
 * import-sarees.ts reads that file and never uploads anything itself, so this
 * is the step that has to run first for a design whose photos are still only
 * on disk.
 *
 * Re-running is safe and cheap: a colour already listed in hosted-images.json
 * is skipped, so this can be run again after adding one more shade without
 * re-uploading — and without changing the URLs already written into products.
 *
 *   npx ts-node prisma/host-saree-images.ts pearl-net-saree <product-slug>
 */
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const [, , assetDir, slug] = process.argv;
if (!assetDir || !slug) {
  console.error('Usage: host-saree-images.ts <asset-dir> <product-slug>');
  process.exit(1);
}

const ASSETS = join(__dirname, 'assets', assetDir);
const MANIFEST = join(ASSETS, 'hosted-images.json');

const CONTENT_TYPE: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function r2() {
  const { R2_BUCKET, R2_PUBLIC_URL, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } =
    process.env;
  if (!R2_BUCKET || !R2_PUBLIC_URL || !R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 is not fully configured in .env');
  }
  return {
    client: new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    }),
    bucket: R2_BUCKET,
    publicUrl: R2_PUBLIC_URL.replace(/\/$/, ''),
  };
}

type Manifest = Record<string, { file: string; url: string }[]>;

async function main() {
  if (!existsSync(ASSETS)) throw new Error(`No such asset dir: ${ASSETS}`);
  const { client, bucket, publicUrl } = r2();

  const manifest: Manifest = existsSync(MANIFEST)
    ? (JSON.parse(readFileSync(MANIFEST, 'utf8')) as Manifest)
    : {};

  const colours = readdirSync(ASSETS).filter((n) => statSync(join(ASSETS, n)).isDirectory());

  for (const colour of colours) {
    if (manifest[colour]?.length) {
      console.log(`  ${colour}: already hosted (${manifest[colour].length}), skipping`);
      continue;
    }
    // Sorted so 01-main lands first — the importer treats index 0 as the
    // primary image, which is what every card and thumbnail shows.
    const files = readdirSync(join(ASSETS, colour))
      .filter((f) => CONTENT_TYPE[f.slice(f.lastIndexOf('.')).toLowerCase()])
      .sort();

    const uploaded: { file: string; url: string }[] = [];
    for (const file of files) {
      const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
      const base = file.slice(0, file.lastIndexOf('.'));
      // The random suffix is what makes re-running safe against a CDN cache:
      // a re-upload gets a new URL rather than overwriting a cached object.
      const key = `products/${slug}/${colour}-${base}-${randomBytes(3).toString('hex')}.jpg`;
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: readFileSync(join(ASSETS, colour, file)),
          ContentType: CONTENT_TYPE[ext],
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
      uploaded.push({ file, url: `${publicUrl}/${key}` });
      console.log(`  ${colour}/${file} -> ${key}`);
    }
    manifest[colour] = uploaded;
  }

  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  const total = Object.values(manifest).reduce((s, v) => s + v.length, 0);
  console.log(`\nWrote ${MANIFEST} — ${Object.keys(manifest).length} colours, ${total} images.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
