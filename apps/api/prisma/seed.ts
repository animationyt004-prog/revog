/**
 * NO CURFEW — development seed.
 * 16 products across 5 categories, each with 2-3 colorways × S-XXL variants,
 * sale pricing (paise), badges, plus a launch coupon and pincode data.
 *
 * Idempotent: wipes catalog tables first, safe to re-run in dev.
 */
import { PrismaClient, Size, Fit, Badge, ProductStatus, CouponType } from '@prisma/client';

const prisma = new PrismaClient();

const SIZES: Size[] = [Size.S, Size.M, Size.L, Size.XL, Size.XXL];

const COLOR_HEX: Record<string, string> = {
  'Jet Black': '#111111',
  'Off White': '#F2EFE9',
  'Acid Wash Grey': '#8E8E8E',
  'Olive': '#5A6144',
  'Sand': '#CBB68F',
  'Washed Blue': '#5D7A9A',
  'Maroon': '#5E2129',
  'Chocolate': '#4A342A',
  'Lavender': '#B7A6D0',
  'Rust': '#B4553B',
};

// img() gives deterministic placeholder shots until real photos land in R2 (Phase 5).
const img = (seed: string) => `https://picsum.photos/seed/${seed}/900/1200`;

interface SeedProduct {
  name: string;
  slug: string;
  category: string;
  fit: Fit;
  fabric: string;
  mrp: number; // rupees, converted to paise below
  price: number;
  colors: string[];
  badges: Badge[];
  flags?: Partial<{ isNewArrival: boolean; isTrending: boolean; isLimited: boolean; isBestSeller: boolean }>;
  rating?: { avg: number; count: number };
  sold?: number;
  description: string;
}

const CATEGORIES = [
  { name: 'Oversized T-Shirts', slug: 'oversized-tees', description: 'Heavyweight drop-shoulder tees built for the streets.' },
  { name: 'Hoodies & Sweatshirts', slug: 'hoodies', description: 'Brushed fleece. Zero compromise.' },
  { name: 'Cargo Pants', slug: 'cargos', description: 'Utility fits with room to move.' },
  { name: 'Joggers', slug: 'joggers', description: 'Tapered comfort for all-day wear.' },
  { name: 'Shirts', slug: 'shirts', description: 'Relaxed-fit statement shirts.' },
];

const PRODUCTS: SeedProduct[] = [
  // ---- Oversized tees (5) ----
  {
    name: 'AFTER HOURS Oversized Tee', slug: 'after-hours-oversized-tee', category: 'oversized-tees',
    fit: Fit.OVERSIZED, fabric: '240 GSM French Terry Cotton', mrp: 1499, price: 899,
    colors: ['Jet Black', 'Off White', 'Acid Wash Grey'],
    badges: [Badge.BESTSELLER, Badge.SALE], flags: { isBestSeller: true, isTrending: true },
    rating: { avg: 4.6, count: 214 }, sold: 1240,
    description: 'Heavyweight 240 GSM drop-shoulder tee with AFTER HOURS back print. Pre-shrunk, bio-washed, built to outlast your curfew.',
  },
  {
    name: 'STATIC NOISE Acid Wash Tee', slug: 'static-noise-acid-wash-tee', category: 'oversized-tees',
    fit: Fit.OVERSIZED, fabric: '220 GSM Acid-Washed Cotton', mrp: 1599, price: 999,
    colors: ['Acid Wash Grey', 'Jet Black'],
    badges: [Badge.NEW, Badge.SALE], flags: { isNewArrival: true },
    rating: { avg: 4.4, count: 87 }, sold: 430,
    description: 'Every acid-wash panel is unique. STATIC NOISE graphic front, boxy cut, ribbed collar that keeps its shape.',
  },
  {
    name: 'MIDNIGHT PERMIT Graphic Tee', slug: 'midnight-permit-graphic-tee', category: 'oversized-tees',
    fit: Fit.OVERSIZED, fabric: '240 GSM Combed Cotton', mrp: 1399, price: 849,
    colors: ['Jet Black', 'Maroon', 'Sand'],
    badges: [Badge.TRENDING, Badge.SALE], flags: { isTrending: true },
    rating: { avg: 4.7, count: 156 }, sold: 890,
    description: 'High-density MIDNIGHT PERMIT print with puff-ink finish. Drop shoulders, side slits, streets approved.',
  },
  {
    name: 'CITYPROOF Pocket Tee', slug: 'cityproof-pocket-tee', category: 'oversized-tees',
    fit: Fit.RELAXED, fabric: '210 GSM Cotton Jersey', mrp: 1199, price: 749,
    colors: ['Olive', 'Off White'],
    badges: [Badge.SALE], flags: {},
    rating: { avg: 4.3, count: 64 }, sold: 310,
    description: 'Minimal chest-pocket tee in a relaxed cut. The everyday layer that goes with everything you own.',
  },
  {
    name: 'NO SIGNAL Oversized Tee', slug: 'no-signal-oversized-tee', category: 'oversized-tees',
    fit: Fit.OVERSIZED, fabric: '240 GSM French Terry Cotton', mrp: 1499, price: 1499,
    colors: ['Off White', 'Washed Blue'],
    badges: [Badge.LIMITED], flags: { isLimited: true, isNewArrival: true },
    rating: { avg: 4.8, count: 42 }, sold: 180,
    description: 'Limited drop. Glitch-art NO SIGNAL print, numbered run, once it sells out it never returns.',
  },

  // ---- Hoodies (4) ----
  {
    name: 'BLACKOUT Heavyweight Hoodie', slug: 'blackout-heavyweight-hoodie', category: 'hoodies',
    fit: Fit.OVERSIZED, fabric: '400 GSM Brushed Fleece', mrp: 2999, price: 1999,
    colors: ['Jet Black', 'Chocolate'],
    badges: [Badge.BESTSELLER, Badge.SALE], flags: { isBestSeller: true },
    rating: { avg: 4.8, count: 302 }, sold: 1520,
    description: '400 GSM brushed-fleece hoodie with double-lined hood and hidden phone pocket. Warmth that looks cold.',
  },
  {
    name: 'CURFEW BREAKER Zip Hoodie', slug: 'curfew-breaker-zip-hoodie', category: 'hoodies',
    fit: Fit.REGULAR, fabric: '380 GSM Loopback Fleece', mrp: 3299, price: 2299,
    colors: ['Acid Wash Grey', 'Jet Black', 'Olive'],
    badges: [Badge.TRENDING, Badge.SALE], flags: { isTrending: true },
    rating: { avg: 4.5, count: 118 }, sold: 640,
    description: 'Full-zip with matte hardware and embroidered CURFEW BREAKER script. Layer it open or zip out the world.',
  },
  {
    name: 'LOW FREQUENCY Sweatshirt', slug: 'low-frequency-sweatshirt', category: 'hoodies',
    fit: Fit.OVERSIZED, fabric: '350 GSM Terry', mrp: 2499, price: 1699,
    colors: ['Lavender', 'Sand'],
    badges: [Badge.NEW, Badge.SALE], flags: { isNewArrival: true },
    rating: { avg: 4.4, count: 51 }, sold: 260,
    description: 'Crewneck in washed pastels with tonal LOW FREQUENCY embroidery. Soft-hand feel, heavyweight drape.',
  },
  {
    name: 'NIGHT SHIFT Puff Print Hoodie', slug: 'night-shift-puff-print-hoodie', category: 'hoodies',
    fit: Fit.OVERSIZED, fabric: '400 GSM Brushed Fleece', mrp: 3499, price: 3499,
    colors: ['Jet Black'],
    badges: [Badge.LIMITED, Badge.NEW], flags: { isLimited: true, isNewArrival: true },
    rating: { avg: 4.9, count: 28 }, sold: 95,
    description: 'Limited run. 3D puff NIGHT SHIFT print across the chest, numbered neck label. One colorway, no restock.',
  },

  // ---- Cargos (3) ----
  {
    name: 'STREET UNIT 8-Pocket Cargo', slug: 'street-unit-8-pocket-cargo', category: 'cargos',
    fit: Fit.BAGGY, fabric: 'Cotton Twill', mrp: 2799, price: 1899,
    colors: ['Olive', 'Jet Black', 'Sand'],
    badges: [Badge.BESTSELLER, Badge.SALE], flags: { isBestSeller: true, isTrending: true },
    rating: { avg: 4.6, count: 187 }, sold: 980,
    description: 'Eight functional pockets, adjustable ankle drawcords, reinforced knees. The cargo that carries your whole day.',
  },
  {
    name: 'DRIFT PARACHUTE Cargo', slug: 'drift-parachute-cargo', category: 'cargos',
    fit: Fit.BAGGY, fabric: 'Nylon Ripstop', mrp: 2999, price: 2099,
    colors: ['Jet Black', 'Acid Wash Grey'],
    badges: [Badge.NEW, Badge.SALE], flags: { isNewArrival: true, isTrending: true },
    rating: { avg: 4.5, count: 73 }, sold: 350,
    description: 'Featherweight ripstop parachute cargo with toggle waist and stacked ankles. Moves like air, hits like a statement.',
  },
  {
    name: 'CONCRETE WASH Denim Cargo', slug: 'concrete-wash-denim-cargo', category: 'cargos',
    fit: Fit.RELAXED, fabric: '12 oz Washed Denim', mrp: 3199, price: 2399,
    colors: ['Washed Blue', 'Jet Black'],
    badges: [Badge.SALE], flags: {},
    rating: { avg: 4.3, count: 59 }, sold: 240,
    description: 'Stone-washed denim cargo with utility flap pockets. Rugged wash, broken-in feel from day one.',
  },

  // ---- Joggers (2) ----
  {
    name: 'HOMEBOUND Fleece Jogger', slug: 'homebound-fleece-jogger', category: 'joggers',
    fit: Fit.REGULAR, fabric: '320 GSM Fleece', mrp: 1999, price: 1299,
    colors: ['Jet Black', 'Acid Wash Grey', 'Olive'],
    badges: [Badge.BESTSELLER, Badge.SALE], flags: { isBestSeller: true },
    rating: { avg: 4.5, count: 143 }, sold: 760,
    description: 'Tapered fleece jogger with deep zip pockets and ribbed cuffs. Couch-to-street certified.',
  },
  {
    name: 'FAST LANE Tech Jogger', slug: 'fast-lane-tech-jogger', category: 'joggers',
    fit: Fit.SLIM, fabric: '4-Way Stretch Poly', mrp: 2299, price: 1599,
    colors: ['Jet Black', 'Chocolate'],
    badges: [Badge.NEW, Badge.SALE], flags: { isNewArrival: true },
    rating: { avg: 4.4, count: 38 }, sold: 190,
    description: 'Water-repellent 4-way stretch with zonal ventilation and hidden ankle zips. Built for motion.',
  },

  // ---- Shirts (2) ----
  {
    name: 'OFF DUTY Corduroy Overshirt', slug: 'off-duty-corduroy-overshirt', category: 'shirts',
    fit: Fit.RELAXED, fabric: '8-Wale Corduroy', mrp: 2499, price: 1799,
    colors: ['Chocolate', 'Olive', 'Sand'],
    badges: [Badge.TRENDING, Badge.SALE], flags: { isTrending: true },
    rating: { avg: 4.6, count: 92 }, sold: 410,
    description: 'Plush corduroy overshirt that works as a shacket. Two-way styling: buttoned up or thrown over a tee.',
  },
  {
    name: 'RESTRICTED AREA Flannel', slug: 'restricted-area-flannel', category: 'shirts',
    fit: Fit.RELAXED, fabric: 'Brushed Cotton Flannel', mrp: 2199, price: 1499,
    colors: ['Maroon', 'Rust'],
    badges: [Badge.SALE], flags: { isNewArrival: true },
    rating: { avg: 4.2, count: 47 }, sold: 220,
    description: 'Brushed flannel in oversized plaid with drop shoulders. Soft enough to sleep in, sharp enough not to.',
  },
];

const PINCODES = [
  { pincode: '400001', city: 'Mumbai', state: 'Maharashtra', codAvailable: true, etaMinDays: 2, etaMaxDays: 4 },
  { pincode: '110001', city: 'New Delhi', state: 'Delhi', codAvailable: true, etaMinDays: 2, etaMaxDays: 4 },
  { pincode: '560001', city: 'Bengaluru', state: 'Karnataka', codAvailable: true, etaMinDays: 2, etaMaxDays: 5 },
  { pincode: '700001', city: 'Kolkata', state: 'West Bengal', codAvailable: true, etaMinDays: 3, etaMaxDays: 6 },
  { pincode: '600001', city: 'Chennai', state: 'Tamil Nadu', codAvailable: true, etaMinDays: 3, etaMaxDays: 6 },
  { pincode: '500001', city: 'Hyderabad', state: 'Telangana', codAvailable: true, etaMinDays: 2, etaMaxDays: 5 },
  { pincode: '380001', city: 'Ahmedabad', state: 'Gujarat', codAvailable: true, etaMinDays: 3, etaMaxDays: 6 },
  { pincode: '302001', city: 'Jaipur', state: 'Rajasthan', codAvailable: true, etaMinDays: 3, etaMaxDays: 6 },
  { pincode: '226001', city: 'Lucknow', state: 'Uttar Pradesh', codAvailable: true, etaMinDays: 4, etaMaxDays: 7 },
  { pincode: '790001', city: 'Itanagar', state: 'Arunachal Pradesh', codAvailable: false, etaMinDays: 6, etaMaxDays: 10 },
];

// Deterministic pseudo-random stock so re-seeds are stable.
function stockFor(productIdx: number, colorIdx: number, sizeIdx: number): number {
  const n = (productIdx * 7 + colorIdx * 5 + sizeIdx * 3) % 23;
  if (n === 0) return 0; // some out-of-stock combos to exercise the UI
  if (n < 4) return n; // low stock
  return 8 + n; // healthy stock
}

const toPaise = (rupees: number) => Math.round(rupees * 100);

async function main() {
  console.log('Seeding NO CURFEW catalog...');

  // Wipe catalog (order matters for FKs).
  await prisma.cartItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.pincode.deleteMany();

  const categoryBySlug = new Map<string, string>();
  for (const [i, c] of CATEGORIES.entries()) {
    const cat = await prisma.category.create({
      data: { ...c, sortOrder: i, image: img(`cat-${c.slug}`) },
    });
    categoryBySlug.set(c.slug, cat.id);
  }

  let variantCount = 0;
  for (const [pi, p] of PRODUCTS.entries()) {
    const skuBase = `NC${String(pi + 1).padStart(3, '0')}`;
    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        gender: 'MEN',
        fit: p.fit,
        fabric: p.fabric,
        status: ProductStatus.PUBLISHED,
        mrp: toPaise(p.mrp),
        price: toPaise(p.price),
        categoryId: categoryBySlug.get(p.category),
        badges: p.badges,
        isNewArrival: p.flags?.isNewArrival ?? false,
        isTrending: p.flags?.isTrending ?? false,
        isLimited: p.flags?.isLimited ?? false,
        isBestSeller: p.flags?.isBestSeller ?? false,
        ratingAvg: p.rating?.avg ?? 0,
        ratingCount: p.rating?.count ?? 0,
        soldCount: p.sold ?? 0,
        metaTitle: `${p.name} | NO CURFEW`,
        metaDescription: p.description.slice(0, 155),
        images: {
          create: p.colors.flatMap((color, ci) => [
            {
              url: img(`${p.slug}-${ci}-a`),
              alt: `${p.name} — ${color}`,
              color,
              sortOrder: ci * 2,
              isPrimary: ci === 0,
            },
            {
              url: img(`${p.slug}-${ci}-b`),
              alt: `${p.name} — ${color} (alternate)`,
              color,
              sortOrder: ci * 2 + 1,
            },
          ]),
        },
        variants: {
          create: p.colors.flatMap((color, ci) =>
            SIZES.map((size, si) => {
              variantCount++;
              return {
                sku: `${skuBase}-${color.replace(/\s+/g, '').toUpperCase().slice(0, 6)}-${size}`,
                size,
                color,
                colorHex: COLOR_HEX[color] ?? '#000000',
                stock: stockFor(pi, ci, si),
              };
            }),
          ),
        },
      },
    });
  }

  await prisma.coupon.create({
    data: {
      code: 'NOCURFEW10',
      description: 'Launch offer — 10% off on orders above ₹999',
      type: CouponType.PERCENT,
      value: 10,
      minCartValue: toPaise(999),
      maxDiscount: toPaise(500),
      usageLimit: 1000,
      perUserLimit: 2,
      isActive: true,
    },
  });

  await prisma.pincode.createMany({ data: PINCODES });

  const counts = {
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    variants: await prisma.productVariant.count(),
    images: await prisma.productImage.count(),
    coupons: await prisma.coupon.count(),
    pincodes: await prisma.pincode.count(),
  };
  console.log('Seed complete:', counts, `(expected variants: ${variantCount})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
