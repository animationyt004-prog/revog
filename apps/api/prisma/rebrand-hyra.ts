/**
 * One-off rebrand: REVOG -> Hyra Fashion across stored content.
 *
 * Renames the welcome coupon, re-brands own-label products, and rewrites the
 * brand name inside product copy / SEO meta. Historical orders keep whatever
 * coupon code they were placed with — those are records, not live config.
 *
 * Run: `npx ts-node --transpile-only prisma/rebrand-hyra.ts`
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OLD_CODE = 'REVOG10';
const NEW_CODE = 'HYRA10';

async function main(): Promise<void> {
  // 1. Coupon code (and any active carts still holding the old code).
  const coupon = await prisma.coupon.findUnique({ where: { code: OLD_CODE } });
  if (coupon) {
    await prisma.coupon.update({ where: { code: OLD_CODE }, data: { code: NEW_CODE } });
    const carts = await prisma.cart.updateMany({
      where: { couponCode: OLD_CODE },
      data: { couponCode: NEW_CODE },
    });
    console.log(`coupon ${OLD_CODE} -> ${NEW_CODE} (carts updated: ${carts.count})`);
  } else {
    console.log(`coupon ${OLD_CODE} not found (already renamed?)`);
  }

  // 2. Own-label products.
  const brand = await prisma.product.updateMany({
    where: { brand: 'REVOG' },
    data: { brand: 'Hyra Fashion' },
  });
  console.log(`product brand REVOG -> Hyra Fashion: ${brand.count}`);

  // 3. Brand name inside stored copy / SEO meta.
  const desc = await prisma.$executeRaw`
    UPDATE "Product" SET "description" = REPLACE("description", 'REVOG', 'Hyra Fashion')
    WHERE "description" LIKE '%REVOG%'`;
  const mt = await prisma.$executeRaw`
    UPDATE "Product" SET "metaTitle" = REPLACE("metaTitle", 'REVOG', 'Hyra Fashion')
    WHERE "metaTitle" LIKE '%REVOG%'`;
  const md = await prisma.$executeRaw`
    UPDATE "Product" SET "metaDescription" = REPLACE("metaDescription", 'REVOG', 'Hyra Fashion')
    WHERE "metaDescription" LIKE '%REVOG%'`;
  console.log(`copy rewritten — description: ${desc}, metaTitle: ${mt}, metaDescription: ${md}`);

  const left = await prisma.product.count({
    where: {
      OR: [
        { description: { contains: 'REVOG' } },
        { metaTitle: { contains: 'REVOG' } },
        { metaDescription: { contains: 'REVOG' } },
        { brand: { contains: 'REVOG' } },
      ],
    },
  });
  console.log(`products still mentioning REVOG: ${left}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
