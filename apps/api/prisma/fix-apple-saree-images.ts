import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const imageBySlug: Record<string, string> = {
  'apple-harmony-vol-2-organza-printed-designer-saree':
    'https://imgbook.textileexport.in/imgbook/product/o/20260211/1770807231373973196.jpeg',
  'apple-laila-vol-1-organza-digital-printed-saree-collection':
    'https://textile-export.b-cdn.net/images/800/20251114/176310664064474350.jpeg',
  'apple-womaniya-34-bhagalpuri-silk-printed-saree-collection':
    'https://textile-export.b-cdn.net/images/800/20250616/17500513561908341979.jpeg',
  'apple-womaniya-35-traditional-wear-bhagalpuri-silk-saree-collection':
    'https://textile-export.b-cdn.net/images/800/20250616/17500659682123787303.jpeg',
  'apple-womaniya-vol-28-bhagalpuri-printed-silk-saree-collection':
    'https://data.bhawanitextile.com/images/product/sub_images/2023/10/apple-womaniya-vol-28-series-2801-2812-bhagalpuri-silk-saree-0-2023-10-05_18_27_47.jpeg',
  'apple-womaniya-32-bhagalpuri-silk-printed-saree-collection':
    'https://textile-export.b-cdn.net/images/800/20250616/17500513561908341979.jpeg',
  'apple-nitya-silk-12-bhagalpuri-silk-printed-saree-collection':
    'https://textile-export.b-cdn.net/images/800/20251114/176310664064474350.jpeg',
  'apple-indigo-vol-2-printed-bhagalpuri-silk-saree-collection':
    'https://data.bhawanitextile.com/images/product/sub_images/2023/10/apple-womaniya-vol-28-series-2801-2812-bhagalpuri-silk-saree-0-2023-10-05_18_27_47.jpeg',
  'apple-feelmax-vol-1-printed-japan-satin-saree':
    'https://imgbook.textileexport.in/imgbook/product/o/20260211/1770807231373973196.jpeg',
  'apple-3-gorgeous-party-wear-georgette-saree-collection':
    'https://textile-export.b-cdn.net/images/800/20250616/17500659682123787303.jpeg',
};

async function replaceImage(slug: string, url: string): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });

  if (!product) {
    console.log(`Missing product: ${slug}`);
    return;
  }

  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId: product.id } }),
    prisma.productImage.create({
      data: {
        productId: product.id,
        url,
        alt: product.name,
        color: 'Assorted',
        sortOrder: 0,
        isPrimary: true,
      },
    }),
  ]);

  console.log(`Updated image: ${product.name}`);
}

async function main(): Promise<void> {
  for (const [slug, url] of Object.entries(imageBySlug)) {
    await replaceImage(slug, url);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
