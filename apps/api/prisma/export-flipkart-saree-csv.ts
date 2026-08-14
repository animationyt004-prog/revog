/**
 * Build a Flipkart bulk-listing CSV for a saree product straight from the DB —
 * one row per colour variant, sharing a style code so Flipkart groups them as
 * colour options on a single product page.
 *
 * Column headers follow Flipkart's Saree vertical template, but Flipkart tweaks
 * them per category: download the template from Seller Hub (Listings -> Add in
 * Bulk) and paste these values under the matching headers rather than uploading
 * this file as-is.
 *
 * Run: `npm run db:export:flipkart -- <product-slug>`
 * Output: prisma/out/flipkart-<slug>.csv
 */
import { PrismaClient } from '@prisma/client';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

const DEFAULT_SLUG = 'women-designer-peacock-digital-print-saree-rhinestone-work';

/** Registered address printed on the pack — overridable per environment. */
const ADDRESS = 'HyraLuxe, 131 Vaikunthdham Society, Godadara, Surat, Gujarat - 395010';

/** Listing constants — verify each against your Seller Hub account before upload. */
const LISTING = {
  styleCode: 'HF-PCK-01',
  modelName: 'Peacock Digital Print Saree',
  hsn: '540752',
  taxCode: 'GST_5',
  fulfilmentBy: 'Seller',
  procurementType: 'Domestic',
  procurementSlaDays: 2,
  shippingProvider: 'Flipkart',
  countryOfOrigin: 'India',
  // Legal Metrology requires the full address with PIN — a blank here fails QC.
  manufacturer: process.env.FLIPKART_MANUFACTURER_DETAILS ?? ADDRESS,
  packer: process.env.FLIPKART_PACKER_DETAILS ?? ADDRESS,
  packageCm: { length: 30, breadth: 25, height: 6 },
  packageKg: 0.7,
  sareeFabric: 'Cotton Silk',
  blouseFabric: 'Cotton Silk',
  pattern: 'Printed',
  occasion: 'Festive',
  type: 'Fashion Saree',
  blousePiece: 'Yes',
  sareeLengthM: 5.5,
  blouseLengthM: 0.8,
  salesPackage: '1 Saree, 1 Blouse Piece',
  packOf: 1,
  ornamentation: 'Stone Work',
  netQuantity: 1,
  washCare: 'Dry Clean Only',
  searchKeywords:
    'saree,sarees for women,peacock print saree,digital print saree,designer saree,party wear saree,cotton silk saree,stone work saree,wedding saree',
};

const HEADERS = [
  'Seller SKU ID',
  'Listing Status',
  'MRP (INR)',
  'Your selling price (INR)',
  'Fullfilment by',
  'Procurement type',
  'Procurement SLA (days)',
  'Stock',
  'Shipping provider',
  'Local delivery charge',
  'Zonal delivery charge',
  'National delivery charge',
  'Length (cm)',
  'Breadth (cm)',
  'Height (cm)',
  'Weight (kg)',
  'HSN',
  'Tax Code',
  'Country Of Origin',
  'Manufacturer Details',
  'Packer Details',
  'Brand',
  'Style Code',
  'Model Name',
  'Color',
  'Saree Fabric',
  'Blouse Fabric',
  'Pattern',
  'Occasion',
  'Type',
  'Blouse Piece',
  'Saree Length (m)',
  'Blouse Length (m)',
  'Sales Package',
  'Pack of',
  'Ornamentation Type',
  'Net Quantity',
  'Wash Care',
  'Main Image URL',
  'Other Image URL 1',
  'Other Image URL 2',
  'Other Image URL 3',
  'Product Description',
  'Search Keywords',
];

/** Quote anything containing a comma, quote or newline; double up inner quotes. */
function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const toRupees = (paise: number) => Math.round(paise / 100);

async function main(): Promise<void> {
  const slug = process.argv[2] ?? DEFAULT_SLUG;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { orderBy: { color: 'asc' } },
    },
  });
  if (!product) throw new Error(`No product with slug "${slug}".`);
  if (product.variants.length === 0) throw new Error(`"${slug}" has no variants to list.`);

  if (!LISTING.manufacturer || !LISTING.packer) {
    console.warn(
      'WARNING: FLIPKART_MANUFACTURER_DETAILS / FLIPKART_PACKER_DETAILS not set — ' +
        'those columns will be blank and Flipkart will reject the rows.',
    );
  }

  const rows: string[] = [HEADERS.map(csvCell).join(',')];
  const missingImages: string[] = [];

  for (const variant of product.variants) {
    // Images tagged with this colour; fall back to untagged ones so a
    // single-image product still exports something usable.
    const tagged = product.images.filter((img) => img.color === variant.color);
    const pool = tagged.length > 0 ? tagged : product.images.filter((img) => !img.color);
    if (pool.length === 0) missingImages.push(variant.color);
    const [main, ...others] = pool.map((img) => img.url);

    const priceRupees = toRupees(variant.priceOverride ?? product.price);
    const description = `${variant.color} ${product.description.charAt(0).toLowerCase()}${product.description.slice(1)}`;

    rows.push(
      [
        variant.sku,
        'Active',
        toRupees(product.mrp),
        priceRupees,
        LISTING.fulfilmentBy,
        LISTING.procurementType,
        LISTING.procurementSlaDays,
        variant.stock,
        LISTING.shippingProvider,
        0,
        0,
        0,
        LISTING.packageCm.length,
        LISTING.packageCm.breadth,
        LISTING.packageCm.height,
        LISTING.packageKg,
        LISTING.hsn,
        LISTING.taxCode,
        LISTING.countryOfOrigin,
        LISTING.manufacturer,
        LISTING.packer,
        product.brand,
        LISTING.styleCode,
        LISTING.modelName,
        variant.color,
        LISTING.sareeFabric,
        LISTING.blouseFabric,
        LISTING.pattern,
        LISTING.occasion,
        LISTING.type,
        LISTING.blousePiece,
        LISTING.sareeLengthM,
        LISTING.blouseLengthM,
        LISTING.salesPackage,
        LISTING.packOf,
        LISTING.ornamentation,
        LISTING.netQuantity,
        LISTING.washCare,
        main ?? '',
        others[0] ?? '',
        others[1] ?? '',
        others[2] ?? '',
        description,
        LISTING.searchKeywords,
      ]
        .map(csvCell)
        .join(','),
    );
  }

  const outDir = join(__dirname, 'out');
  mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, `flipkart-${slug}.csv`);
  writeFileSync(outFile, `${rows.join('\r\n')}\r\n`, 'utf8');

  console.log(`Wrote ${product.variants.length} rows to ${outFile}`);
  if (missingImages.length > 0) {
    console.warn(`WARNING: no images for colour(s): ${missingImages.join(', ')}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
