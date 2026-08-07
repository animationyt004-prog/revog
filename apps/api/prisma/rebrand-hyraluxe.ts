/**
 * One-off rebrand: Hyra Fashion -> HyraLuxe across stored content.
 *
 * Only the own-label brand field carries the name in the database — product
 * copy and category text were checked and hold none — so this is deliberately
 * narrow. Anything broader would be rewriting text nobody has read.
 *
 * Historical orders are left alone. An order is a record of what was sold
 * under the name that was current then; rewriting it would forge the receipt.
 *
 * The HYRA10 coupon keeps its code. "HYRA" survives the rename, the code is
 * printed in the welcome email and sitting in customers' inboxes, and a code
 * that stops working is a worse outcome than one that reads slightly old.
 *
 * Safe to run repeatedly.
 *
 * Run: `npx ts-node --transpile-only prisma/rebrand-hyraluxe.ts`
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OLD_BRAND = 'Hyra Fashion';
const NEW_BRAND = 'HyraLuxe';

async function main() {
  const brand = await prisma.product.updateMany({
    where: { brand: OLD_BRAND },
    data: { brand: NEW_BRAND },
  });
  console.log(`product.brand ${OLD_BRAND} -> ${NEW_BRAND}: ${brand.count}`);

  // Anything left holding the old name is something this script did not know
  // about — worth seeing rather than silently leaving behind.
  const stragglers = await prisma.product.count({
    where: {
      OR: [
        { brand: { contains: 'Hyra Fashion' } },
        { name: { contains: 'Hyra Fashion' } },
        { description: { contains: 'Hyra Fashion' } },
      ],
    },
  });
  console.log(
    stragglers === 0
      ? 'No product still carries the old name.'
      : `WARNING: ${stragglers} product(s) still carry the old name.`,
  );

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
