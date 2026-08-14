/**
 * Import the full saree catalogue: one Product per design, one ProductVariant
 * per colourway, and every hosted photo as a colour-tagged ProductImage.
 *
 * Photos are already on R2 — each `prisma/assets/<design>/hosted-images.json`
 * maps a colour folder to its public URLs, in the order they should appear.
 * Nothing is re-uploaded, so this is safe to run repeatedly.
 *
 * Run: `npm run db:import:sarees`
 * Products land as DRAFT so they can be reviewed before going live; pass
 * `--publish` to import them as PUBLISHED instead.
 */
import { Badge, Fit, Gender, PrismaClient, ProductStatus, Size } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

const PUBLISH = process.argv.includes('--publish');
const ASSETS_DIR = join(__dirname, 'assets');

interface Colourway {
  /** Folder name under the design's asset dir, and the key in hosted-images.json. */
  folder: string;
  /** Customer-facing colour name. */
  name: string;
  hex: string;
  stock: number;
}

interface Design {
  slug: string;
  name: string;
  /** Asset directory holding the colour folders and hosted-images.json. */
  assets: string;
  /**
   * Same code we list under on Flipkart and Meesho, so a SKU means the same
   * thing on every channel and stock can be reconciled across them.
   */
  skuPrefix: string;
  fabric: string;
  /** Rupees — converted to paise on write. */
  mrp: number;
  price: number;
  description: string;
  /** Spec sheet answers — the same values we declare on Flipkart and Meesho. */
  spec: {
    sareeLength: string;
    blouseDetails: string;
    washCare: string;
    occasion: string;
    transparency: string;
  };
  colours: Colourway[];
}

const UNSTITCHED_BLOUSE = 'Unstitched blouse piece included (0.8 m)';
const DRY_CLEAN = 'Dry clean only. Do not bleach.';
const FESTIVE = 'Festive, Wedding, Party';

const designs: Design[] = [
  {
    slug: 'women-designer-peacock-digital-print-saree-rhinestone-work',
    name: 'Women Designer Peacock Digital Print Saree with Rhinestone Diamond Work',
    assets: 'peacock-saree',
    skuPrefix: 'HF-PCK-01',
    fabric: 'Cotton Silk',
    mrp: 2499,
    price: 1699,
    description:
      'Designer saree in soft cotton silk with an all-over peacock and floral digital print, ' +
      'finished with delicate rhinestone diamond work along the border and pallu. Comes with a ' +
      'matching unstitched blouse piece. Light in weight, easy to drape and comfortable for long ' +
      'wear — a graceful pick for weddings, festivals, receptions and family functions.',
    spec: {
      sareeLength: '5.5 m',
      blouseDetails: UNSTITCHED_BLOUSE,
      washCare: DRY_CLEAN,
      occasion: FESTIVE,
      transparency: 'Opaque',
    },
    colours: [
      { folder: 'beige', name: 'Beige', hex: '#C2A98A', stock: 10 },
      { folder: 'grey', name: 'Grey', hex: '#8A8C8F', stock: 10 },
      { folder: 'sea-green', name: 'Sea Green', hex: '#5FA79B', stock: 10 },
      { folder: 'wine', name: 'Wine', hex: '#9C5A78', stock: 10 },
      { folder: 'purple', name: 'Purple', hex: '#963A9E', stock: 10 },
      { folder: 'blue', name: 'Blue Grey', hex: '#6B7A9E', stock: 10 },
    ],
  },
  {
    slug: 'women-traditional-embroidered-fancy-saree-paisley-pallu',
    name: 'Women Traditional Embroidered Fancy Saree with Paisley Pallu & Designer Border',
    assets: 'paisley-saree',
    skuPrefix: 'HF-PSL-01',
    fabric: 'Art Silk',
    mrp: 2499,
    price: 1599,
    description:
      'Traditional saree in a smooth art silk with colourful embroidered paisley butis scattered ' +
      'across the drape, a richly worked paisley motif on the pallu and a scalloped designer ' +
      'border. Comes with a matching unstitched blouse piece. Falls softly, drapes easily and ' +
      'carries its weight well — a graceful pick for weddings, festivals and family functions.',
    spec: {
      sareeLength: '5.5 m',
      blouseDetails: UNSTITCHED_BLOUSE,
      washCare: DRY_CLEAN,
      occasion: FESTIVE,
      transparency: 'Opaque',
    },
    colours: [
      { folder: 'teal', name: 'Teal', hex: '#1F6F6B', stock: 12 },
      { folder: 'royal-blue', name: 'Royal Blue', hex: '#1E3A6E', stock: 12 },
      { folder: 'dark-green', name: 'Bottle Green', hex: '#14532D', stock: 12 },
      { folder: 'rani-pink', name: 'Rani Pink', hex: '#C2185B', stock: 12 },
      { folder: 'mustard', name: 'Mustard', hex: '#C9A227', stock: 12 },
      { folder: 'purple', name: 'Purple', hex: '#6B2D8C', stock: 12 },
    ],
  },
  {
    slug: 'women-mirror-sequin-embroidered-chiffon-saree',
    name: 'Women Mirror & Sequin Embroidered Saree with Heavy Blouse',
    assets: 'mirror-saree',
    skuPrefix: 'HF-MIR-01',
    fabric: 'NC Moss Chiffon',
    mrp: 2499,
    price: 1699,
    description:
      'Saree in a soft NC moss chiffon that falls light and drapes easily, dressed up with mirror ' +
      'and sequin embroidery along the border and scattered motifs across the drape and pallu. ' +
      'Comes with a heavily worked matching blouse piece. A shimmering, graceful pick for ' +
      'weddings, receptions, festive evenings and family functions.',
    spec: {
      sareeLength: '5.5 m',
      blouseDetails: UNSTITCHED_BLOUSE,
      washCare: DRY_CLEAN,
      occasion: FESTIVE,
      transparency: 'Semi-transparent',
    },
    colours: [
      { folder: 'wine', name: 'Wine', hex: '#6E2B4F', stock: 1 },
      { folder: 'olive', name: 'Olive', hex: '#7A7B36', stock: 1 },
      { folder: 'rust', name: 'Rust', hex: '#B05423', stock: 1 },
      { folder: 'bottle-green', name: 'Bottle Green', hex: '#14453B', stock: 1 },
      { folder: 'mustard', name: 'Mustard', hex: '#C9A227', stock: 1 },
      { folder: 'grey', name: 'Grey', hex: '#6E6E70', stock: 1 },
    ],
  },
  {
    slug: 'women-traditional-peacock-zari-cotton-tissue-saree',
    name: 'Women Traditional Peacock Zari Woven Cotton Tissue Saree with Tassels',
    assets: 'peacock-zari-saree',
    skuPrefix: 'HF-ZAR-01',
    fabric: 'Cotton Tissue',
    mrp: 1499,
    price: 799,
    description:
      'Traditional saree in a soft cotton tissue with a fine self-woven texture, a zari woven ' +
      'floral and peacock pallu, matching zari borders and tassel latkans along the edge. Comes ' +
      'with a matching unstitched blouse piece. Light to carry and easy to drape — a graceful ' +
      'pick for festivals, poojas, weddings and family functions.',
    spec: {
      sareeLength: '5.5 m',
      blouseDetails: UNSTITCHED_BLOUSE,
      washCare: DRY_CLEAN,
      occasion: FESTIVE,
      transparency: 'Opaque',
    },
    colours: [
      { folder: 'teal', name: 'Teal', hex: '#0F5B57', stock: 2 },
      { folder: 'maroon', name: 'Maroon', hex: '#6B1F33', stock: 2 },
      { folder: 'navy', name: 'Navy Blue', hex: '#16305C', stock: 2 },
      { folder: 'purple', name: 'Purple', hex: '#4B2160', stock: 2 },
    ],
  },
  {
    slug: 'women-cutwork-embroidered-border-georgette-saree',
    name: 'Women Georgette Saree with Heavy Cutwork Embroidered Border',
    assets: 'cutwork-saree',
    skuPrefix: 'HF-CUT-01',
    fabric: 'Georgette',
    mrp: 1299,
    price: 799,
    description:
      'Traditional saree in a soft georgette with fine self butis across the drape, finished with ' +
      'a heavy cutwork embroidered border and a scalloped pearl edge. Comes with a matching ' +
      'unstitched blouse piece. Light to carry and easy to drape — a graceful pick for parties, ' +
      'festive evenings, receptions and family functions.',
    spec: {
      sareeLength: '5.5 m',
      blouseDetails: UNSTITCHED_BLOUSE,
      washCare: DRY_CLEAN,
      occasion: FESTIVE,
      transparency: 'Semi-transparent',
    },
    colours: [
      { folder: 'lilac', name: 'Lavender', hex: '#9B72C4', stock: 2 },
      { folder: 'sage', name: 'Sage Green', hex: '#8FAE97', stock: 2 },
      { folder: 'mehendi', name: 'Mehendi Green', hex: '#9CA43C', stock: 2 },
      { folder: 'blue', name: 'Blue', hex: '#3A5C8C', stock: 2 },
      { folder: 'coral', name: 'Warm Red', hex: '#D95B52', stock: 2 },
    ],
  },
  {
    slug: 'women-metallic-zari-striped-cutwork-border-saree',
    name: 'Women Metallic Zari Striped Saree with Embroidered Cutwork Border',
    assets: 'zari-stripe-saree',
    skuPrefix: 'HF-STR-01',
    fabric: 'Tissue',
    mrp: 1299,
    price: 799,
    description:
      'Saree in a shimmering tissue with bold metallic zari stripes running across the drape and ' +
      'pallu, finished with embroidered cutwork on the border and a fine beaded edge. Comes with ' +
      'a matching unstitched blouse piece. Drapes smoothly and catches the light — a graceful ' +
      'pick for weddings, receptions and festive evenings.',
    spec: {
      sareeLength: '5.5 m',
      blouseDetails: UNSTITCHED_BLOUSE,
      washCare: DRY_CLEAN,
      occasion: FESTIVE,
      transparency: 'Opaque',
    },
    colours: [
      { folder: 'olive', name: 'Olive', hex: '#5E5B2A', stock: 2 },
      { folder: 'green', name: 'Bottle Green', hex: '#14432B', stock: 2 },
      { folder: 'maroon', name: 'Maroon', hex: '#6B1B2E', stock: 2 },
      { folder: 'navy', name: 'Navy Blue', hex: '#152A54', stock: 2 },
      { folder: 'purple', name: 'Purple', hex: '#3F1F52', stock: 2 },
    ],
  },
  {
    slug: 'women-pearl-embellished-net-saree',
    // Named for the border, not the cape. The photos are styled with one, but
    // the title is the strongest claim a product makes and this one cannot be
    // backed until the supplier confirms the cape ships with the saree.
    name: 'Women Pearl Embellished Net Saree with Scalloped Pearl Border',
    assets: 'pearl-net-saree',
    skuPrefix: 'HF-PRL-01',
    fabric: 'Net',
    mrp: 2999,
    price: 1499,
    description:
      'Saree in a fine net with pearl and bead vines curving across the drape and pallu, edged ' +
      'all round with a scalloped pearl-drop border. Comes with a matching unstitched blouse ' +
      'piece. The lightest drape in the range and the most ornamented — made for ' +
      'receptions, sangeets and evening functions.',
    // The photos are styled with a sheer pearl-tasselled cape. Whether that
    // cape ships with the saree is not something the images can settle, so it
    // is not claimed here — the spec promises only the blouse piece the rest
    // of the range promises. Worth confirming with the supplier: if the cape
    // is included it is the strongest thing about this product.
    spec: {
      sareeLength: '5.5 m',
      blouseDetails: UNSTITCHED_BLOUSE,
      washCare: DRY_CLEAN,
      occasion: FESTIVE,
      transparency: 'Transparent',
    },
    colours: [
      { folder: 'white', name: 'White', hex: '#F1EFEA', stock: 2 },
      { folder: 'baby-pink', name: 'Baby Pink', hex: '#EEC4CE', stock: 2 },
      { folder: 'lavender', name: 'Lavender', hex: '#C4B6DD', stock: 2 },
      { folder: 'pista-green', name: 'Pista Green', hex: '#BCCFA1', stock: 2 },
      { folder: 'powder-blue', name: 'Powder Blue', hex: '#B7CBE0', stock: 2 },
    ],
  },
  {
    slug: 'women-floral-embroidered-border-georgette-saree',
    name: 'Women Georgette Saree with Floral Embroidered Border and Running Blouse',
    assets: 'floral-border-saree',
    skuPrefix: 'HF-FLR-01',
    fabric: 'Georgette',
    mrp: 1999,
    price: 1200,
    description:
      'Georgette saree with a colourful floral embroidered border running along the drape and ' +
      'pallu, finished with a matching embroidered running blouse. Soft, light and easy to ' +
      'drape — comfortable for long wear at weddings, receptions, festive evenings and family ' +
      'functions.',
    spec: {
      sareeLength: '5.5 m',
      blouseDetails: 'Running blouse piece included (0.8 m)',
      washCare: DRY_CLEAN,
      occasion: FESTIVE,
      transparency: 'Opaque',
    },
    colours: [
      { folder: 'maroon', name: 'Wine', hex: '#6B1F33', stock: 10 },
      { folder: 'purple', name: 'Purple', hex: '#4B2160', stock: 10 },
      { folder: 'mustard', name: 'Mustard', hex: '#C9A227', stock: 10 },
      { folder: 'teal', name: 'Teal', hex: '#14606B', stock: 10 },
      { folder: 'olive', name: 'Olive Green', hex: '#6B7A2F', stock: 10 },
    ],
  },
  {
    slug: 'women-pastel-floral-embroidered-net-saree',
    name: 'Women Floral Embroidered Net Saree with Scalloped Border',
    assets: 'pastel-floral-net-saree',
    skuPrefix: 'HF-PST-01',
    fabric: 'Net',
    mrp: 2999,
    price: 1799,
    description:
      'Net saree with fine floral embroidery scattered across the drape and a richly worked ' +
      'scalloped floral border on all four sides. Comes with matching embroidered blouse ' +
      'fabric. Light, sheer and easy to drape — made for weddings, receptions, engagements ' +
      'and festive evenings.',
    spec: {
      sareeLength: '5.5 m',
      blouseDetails: 'Running blouse piece included (0.8 m)',
      washCare: DRY_CLEAN,
      occasion: FESTIVE,
      transparency: 'Sheer',
    },
    colours: [
      { folder: 'lavender', name: 'Lavender', hex: '#C3AEDA', stock: 2 },
      { folder: 'mint', name: 'Mint Green', hex: '#A9CFC4', stock: 2 },
      { folder: 'sage', name: 'Sage Green', hex: '#BCCBA6', stock: 2 },
      { folder: 'ivory', name: 'Ivory', hex: '#EFE9DE', stock: 2 },
      { folder: 'dusty-pink', name: 'Dusty Pink', hex: '#D8B6BE', stock: 2 },
    ],
  },
  {
    slug: 'women-printed-pallu-embroidered-buti-saree',
    name: 'Women Printed Pallu Dola Silk Saree with Embroidered Butis',
    assets: 'printed-pallu-saree',
    skuPrefix: 'HF-PLU-01',
    fabric: 'Dola Silk',
    mrp: 1699,
    price: 899,
    description:
      'Dola silk saree with a smooth plain drape, delicate embroidered butis scattered across ' +
      'it, a printed ethnic-motif border on all sides and a richly printed pallu. Comes with a ' +
      'matching printed blouse fabric. Falls softly and drapes easily — made for weddings, ' +
      'festivals, poojas and family functions.',
    spec: {
      sareeLength: '5.5 m',
      blouseDetails: 'Running blouse piece included (0.8 m)',
      washCare: DRY_CLEAN,
      occasion: FESTIVE,
      transparency: 'Opaque',
    },
    colours: [
      { folder: 'mustard', name: 'Mustard', hex: '#B8860B', stock: 2 },
      { folder: 'khaki', name: 'Olive Grey', hex: '#5C5B4B', stock: 2 },
      { folder: 'maroon', name: 'Wine', hex: '#6B2233', stock: 2 },
      { folder: 'teal', name: 'Teal Blue', hex: '#1B5566', stock: 2 },
    ],
  },
  {
    slug: 'women-velvet-patch-stone-work-saree',
    name: 'Women Shimmer Saree with Velvet Patch & Stone Work',
    assets: 'velvet-patch-saree',
    skuPrefix: 'HF-VLV-01',
    fabric: 'Fancy Satin',
    mrp: 2999,
    price: 1699,
    description:
      'Fancy satin saree scattered with velvet medallion patches, each outlined in fine ' +
      'stone work, and finished with a contrast velvet border on all sides. Comes with a ' +
      'matching velvet blouse piece. Falls softly and catches the light as it drapes — made ' +
      'for weddings, receptions, sangeet and festive evenings.',
    spec: {
      sareeLength: '5.5 m',
      blouseDetails: UNSTITCHED_BLOUSE,
      washCare: DRY_CLEAN,
      occasion: FESTIVE,
      transparency: 'Opaque',
    },
    colours: [
      { folder: 'dusty-rose', name: 'Dusty Rose', hex: '#B98079', stock: 2 },
      { folder: 'coral', name: 'Coral Red', hex: '#EE7B6E', stock: 2 },
      { folder: 'mint', name: 'Mint Green', hex: '#A9C79A', stock: 2 },
      { folder: 'lilac', name: 'Lilac', hex: '#B98FD6', stock: 2 },
      { folder: 'olive', name: 'Olive Green', hex: '#A8A055', stock: 2 },
    ],
  },
  {
    slug: 'women-peacock-embroidered-shimmer-saree',
    name: 'Women Shimmer Saree with Peacock Embroidered Motifs & Scalloped Border',
    assets: 'peacock-embroidered-saree',
    skuPrefix: 'HF-PEA-01',
    fabric: 'Fancy Satin',
    mrp: 2999,
    price: 1699,
    description:
      'Fancy satin saree with a soft crushed shimmer, dressed with large peacock and floral ' +
      'motifs embroidered in contrast thread and stone work, and edged with a scalloped ' +
      'border on all sides. Comes with a matching blouse piece. Falls smoothly and holds its ' +
      'drape — made for weddings, receptions, sangeet and festive evenings.',
    spec: {
      sareeLength: '5.5 m',
      blouseDetails: UNSTITCHED_BLOUSE,
      washCare: DRY_CLEAN,
      occasion: FESTIVE,
      transparency: 'Opaque',
    },
    // Gold leads: it is the colourway the storefront card should show first.
    colours: [
      { folder: 'gold', name: 'Gold', hex: '#DCC48E', stock: 3 },
      { folder: 'powder-blue', name: 'Powder Blue', hex: '#A7C4DC', stock: 3 },
      { folder: 'lilac', name: 'Lilac', hex: '#C79BCB', stock: 3 },
      { folder: 'sage', name: 'Sage Green', hex: '#A3B47A', stock: 3 },
      { folder: 'dusty-pink', name: 'Dusty Pink', hex: '#D9A9AE', stock: 3 },
    ],
  },
  {
    slug: 'women-sequin-floral-shimmer-saree-gold-piping',
    name: 'Women Shimmer Saree with Sequin Floral Motifs & Gold Piping Border',
    assets: 'sequin-floral-shimmer-saree',
    skuPrefix: 'HF-SEQ-01',
    fabric: 'Fancy Satin',
    mrp: 2599,
    price: 1299,
    description:
      'Plain fancy satin saree with a soft liquid shimmer, scattered with hand-finished sequin ' +
      'and thread floral sprays across the body and pallu, and outlined with a fine gold zari ' +
      'piping on all sides. Comes with a matching blouse piece. Light on the shoulder and easy ' +
      'to drape — an understated pick for festive evenings, receptions and family functions.',
    spec: {
      sareeLength: '5.5 m',
      blouseDetails: UNSTITCHED_BLOUSE,
      washCare: DRY_CLEAN,
      occasion: FESTIVE,
      transparency: 'Opaque',
    },
    // Mustard Gold leads, matching the shimmer saree above: the warm shade is
    // the one that reads best as a thumbnail against the storefront's dark card.
    colours: [
      { folder: 'mustard-gold', name: 'Mustard Gold', hex: '#C08A1E', stock: 1 },
      { folder: 'sage-green', name: 'Sage Green', hex: '#7C8A82', stock: 1 },
      { folder: 'orchid-mauve', name: 'Orchid Mauve', hex: '#9E6A8E', stock: 1 },
      { folder: 'purple', name: 'Purple', hex: '#6E5B93', stock: 1 },
      { folder: 'teal-blue', name: 'Teal Blue', hex: '#3F7185', stock: 1 },
    ],
  },
];

const toPaise = (rupees: number) => Math.round(rupees * 100);

function skuFor(design: Design, colour: Colourway): string {
  return `${design.skuPrefix}-${colour.folder.toUpperCase().replace(/-/g, '')}`;
}

function hostedImages(design: Design): Record<string, { file: string; url: string }[]> {
  const path = join(ASSETS_DIR, design.assets, 'hosted-images.json');
  return JSON.parse(readFileSync(path, 'utf8'));
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

async function importDesign(design: Design, categoryId: string): Promise<void> {
  const status = PUBLISH ? ProductStatus.PUBLISHED : ProductStatus.DRAFT;
  const shared = {
    name: design.name,
    brand: 'HyraLuxe',
    gender: Gender.WOMEN,
    fit: Fit.REGULAR,
    fabric: design.fabric,
    // Lives in `shared`, not only in `create` — otherwise editing the copy here
    // silently never reaches a product that already exists, and the storefront
    // keeps serving the old text while the file says something else.
    description: design.description,
    status,
    mrp: toPaise(design.mrp),
    price: toPaise(design.price),
    categoryId,
    badges: [Badge.NEW],
    isNewArrival: true,
    sareeLength: design.spec.sareeLength,
    blouseDetails: design.spec.blouseDetails,
    washCare: design.spec.washCare,
    occasion: design.spec.occasion,
    transparency: design.spec.transparency,
    metaTitle: `${design.name} | HYRA`,
    metaDescription: design.description.slice(0, 155),
  };

  const product = await prisma.product.upsert({
    where: { slug: design.slug },
    // status is deliberately absent from the update. Re-running this script to
    // add one new design used to walk every product already in the catalogue
    // back to DRAFT, which takes the live storefront down without saying so.
    // A product's published state is owned by whoever published it; only
    // --publish may raise it, and nothing here may lower it.
    update: { ...shared, status: PUBLISH ? ProductStatus.PUBLISHED : undefined },
    create: { ...shared, slug: design.slug },
    select: { id: true },
  });

  for (const colour of design.colours) {
    await prisma.productVariant.upsert({
      where: { sku: skuFor(design, colour) },
      update: { stock: colour.stock, colorHex: colour.hex },
      create: {
        productId: product.id,
        sku: skuFor(design, colour),
        size: Size.FREE_SIZE,
        color: colour.name,
        colorHex: colour.hex,
        stock: colour.stock,
      },
    });
  }

  // Images are replaced wholesale so a re-run never leaves an orphan behind.
  const hosted = hostedImages(design);
  const rows: { url: string; alt: string; color: string; sortOrder: number; isPrimary: boolean }[] = [];
  let sortOrder = 0;

  for (const colour of design.colours) {
    // `x-` files are collages: fine here, kept last so a clean shot leads.
    const entries = [...(hosted[colour.folder] ?? [])].sort(
      (a, b) => Number(a.file.startsWith('x-')) - Number(b.file.startsWith('x-')),
    );
    entries.forEach((entry, index) => {
      rows.push({
        url: entry.url,
        alt: `${design.name} - ${colour.name}`,
        color: colour.name,
        sortOrder: sortOrder++,
        isPrimary: index === 0,
      });
    });
  }

  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId: product.id } }),
    prisma.productImage.createMany({ data: rows.map((r) => ({ ...r, productId: product.id })) }),
  ]);

  console.log(
    `${design.name}\n  ${design.colours.length} colours, ${rows.length} images, ` +
      `Rs ${design.mrp} -> ${design.price}, ${status}`,
  );
}

async function main(): Promise<void> {
  const categoryId = await ensureSareeCategory();

  for (const design of designs) {
    await importDesign(design, categoryId);
  }

  const colours = designs.reduce((n, d) => n + d.colours.length, 0);
  console.log(
    `\nImported ${designs.length} sarees, ${colours} colourways as ` +
      `${PUBLISH ? 'PUBLISHED' : 'DRAFT'}.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
