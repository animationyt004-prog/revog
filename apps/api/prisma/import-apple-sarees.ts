import { Badge, Fit, Gender, PrismaClient, ProductStatus, Size } from '@prisma/client';

const prisma = new PrismaClient();

const MARKUP_RUPEES = 300;
const IMAGE_BASE = 'https://picsum.photos/seed';

interface AppleSaree {
  name: string;
  slug: string;
  sourcePrice: number;
  fabric: string;
  sourceUrl: string;
  stock: number;
}

const products: AppleSaree[] = [
  {
    name: 'Apple Feelmax Vol 1 Printed Japan Satin Saree',
    slug: 'apple-feelmax-vol-1-printed-japan-satin-saree',
    sourcePrice: 748,
    fabric: 'Satin',
    sourceUrl: 'https://www.textileexport.in/garden-sarees-wholesale',
    stock: 6,
  },
  {
    name: 'Apple Harmony Vol 2 Organza Printed Designer Saree',
    slug: 'apple-harmony-vol-2-organza-printed-designer-saree',
    sourcePrice: 797,
    fabric: 'Organza',
    sourceUrl: 'https://www.textileexport.in/organza-sarees-wholesale',
    stock: 8,
  },
  {
    name: 'Apple Laila Vol 1 Organza Digital Printed Saree Collection',
    slug: 'apple-laila-vol-1-organza-digital-printed-saree-collection',
    sourcePrice: 875,
    fabric: 'Organza',
    sourceUrl: 'https://www.textileexport.in/organza-sarees-wholesale',
    stock: 8,
  },
  {
    name: 'Apple Womaniya 34 Bhagalpuri Silk Printed Saree Collection',
    slug: 'apple-womaniya-34-bhagalpuri-silk-printed-saree-collection',
    sourcePrice: 424,
    fabric: 'Bhagalpuri Silk',
    sourceUrl: 'https://www.textileexport.in/wholesale-bhagalpuri-silk-sarees',
    stock: 12,
  },
  {
    name: 'Apple Womaniya 32 Bhagalpuri Silk Printed Saree Collection',
    slug: 'apple-womaniya-32-bhagalpuri-silk-printed-saree-collection',
    sourcePrice: 424,
    fabric: 'Bhagalpuri Silk',
    sourceUrl: 'https://www.textileexport.in/wholesale-bhagalpuri-silk-sarees',
    stock: 8,
  },
  {
    name: 'Apple Womaniya 35 Traditional Wear Bhagalpuri Silk Saree Collection',
    slug: 'apple-womaniya-35-traditional-wear-bhagalpuri-silk-saree-collection',
    sourcePrice: 424,
    fabric: 'Bhagalpuri Silk',
    sourceUrl: 'https://www.textileexport.in/wholesale-bhagalpuri-silk-sarees',
    stock: 8,
  },
  {
    name: 'Apple Nitya Silk 12 Bhagalpuri Silk Printed Saree Collection',
    slug: 'apple-nitya-silk-12-bhagalpuri-silk-printed-saree-collection',
    sourcePrice: 534,
    fabric: 'Bhagalpuri Silk',
    sourceUrl: 'https://www.textileexport.in/wholesale-bhagalpuri-silk-sarees',
    stock: 8,
  },
  {
    name: 'Apple Womaniya Vol 28 Bhagalpuri Printed Silk Saree Collection',
    slug: 'apple-womaniya-vol-28-bhagalpuri-printed-silk-saree-collection',
    sourcePrice: 418,
    fabric: 'Bhagalpuri Silk',
    sourceUrl: 'https://www.textileexport.in/wholesale-bhagalpuri-silk-sarees',
    stock: 12,
  },
  {
    name: 'Apple Indigo Vol 2 Printed Bhagalpuri Silk Saree Collection',
    slug: 'apple-indigo-vol-2-printed-bhagalpuri-silk-saree-collection',
    sourcePrice: 385,
    fabric: 'Bhagalpuri Silk',
    sourceUrl: 'https://www.textileexport.in/wholesale-bhagalpuri-silk-sarees',
    stock: 12,
  },
  {
    name: 'Apple 3 Gorgeous Party Wear Georgette Saree Collection',
    slug: 'apple-3-gorgeous-party-wear-georgette-saree-collection',
    sourcePrice: 715,
    fabric: 'Georgette',
    sourceUrl: 'https://www.textileexport.in/apple-3-gorgeous-party-wear-georgette-saree-collection',
    stock: 6,
  },
];

const toPaise = (rupees: number) => Math.round(rupees * 100);

function retailPrice(sourcePrice: number): number {
  return sourcePrice + MARKUP_RUPEES;
}

async function ensureSareeCategory(): Promise<string> {
  const parent = await prisma.category.upsert({
    where: { slug: 'women' },
    update: {},
    create: {
      name: 'Women',
      slug: 'women',
      description: 'Premium ethnic fashion for women.',
      sortOrder: 10,
      image: `${IMAGE_BASE}/revog-women/900/1200`,
    },
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
      image: `${IMAGE_BASE}/revog-sarees/900/1200`,
    },
  });

  return sarees.id;
}

async function upsertProduct(item: AppleSaree, categoryId: string): Promise<void> {
  const price = retailPrice(item.sourcePrice);
  const mrp = price + 300;
  // Customer-facing copy only — never expose source cost or markup. Rich,
  // per-product descriptions are set by fix-apple-saree-descriptions.ts.
  const description =
    `${item.name}. A ${item.fabric.toLowerCase()} saree with a soft, easy drape, ` +
    `finished with a matching unstitched blouse piece. Ready for festive days and celebrations.`;

  await prisma.product.upsert({
    where: { slug: item.slug },
    update: {
      name: item.name,
      brand: 'Apple Saree',
      gender: Gender.WOMEN,
      fit: Fit.REGULAR,
      fabric: item.fabric,
      status: ProductStatus.PUBLISHED,
      mrp: toPaise(mrp),
      price: toPaise(price),
      categoryId,
      badges: [Badge.NEW],
      isNewArrival: true,
      metaTitle: `${item.name} | REVOG`,
      metaDescription: description.slice(0, 155),
    },
    create: {
      name: item.name,
      slug: item.slug,
      description,
      brand: 'Apple Saree',
      gender: Gender.WOMEN,
      fit: Fit.REGULAR,
      fabric: item.fabric,
      status: ProductStatus.PUBLISHED,
      mrp: toPaise(mrp),
      price: toPaise(price),
      categoryId,
      badges: [Badge.NEW],
      isNewArrival: true,
      metaTitle: `${item.name} | REVOG`,
      metaDescription: description.slice(0, 155),
      images: {
        create: [
          {
            url: `${IMAGE_BASE}/${item.slug}/900/1200`,
            alt: item.name,
            color: 'Assorted',
            sortOrder: 0,
            isPrimary: true,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: `APPLE-${item.slug.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 42)}`,
            size: Size.FREE_SIZE,
            color: 'Assorted',
            colorHex: '#8A1538',
            stock: item.stock,
          },
        ],
      },
    },
  });
}

async function main(): Promise<void> {
  const categoryId = await ensureSareeCategory();

  for (const item of products) {
    await upsertProduct(item, categoryId);
    console.log(`${item.name}: Rs ${item.sourcePrice} + Rs ${MARKUP_RUPEES} = Rs ${retailPrice(item.sourcePrice)}`);
  }

  console.log(`Imported ${products.length} Apple Saree products.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
