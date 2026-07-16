import { Injectable, NotFoundException } from '@nestjs/common';
import { Fit, Prisma, ProductStatus, Size } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

export type Collection = 'new' | 'trending' | 'limited' | 'bestsellers';
export type SortKey = 'newest' | 'popular' | 'price_asc' | 'price_desc' | 'discount' | 'rating';

export interface ListFilters {
  collection?: Collection;
  category?: string;
  sizes?: Size[];
  colors?: string[];
  fits?: Fit[];
  fabrics?: string[];
  minPrice?: number; // paise
  maxPrice?: number; // paise
  sort?: SortKey;
  take?: number;
  skip?: number;
}

const COLLECTION_WHERE: Record<Collection, Prisma.ProductWhereInput> = {
  new: { isNewArrival: true },
  trending: { isTrending: true },
  limited: { isLimited: true },
  bestsellers: { isBestSeller: true },
};

const SORT_ORDER: Record<Exclude<SortKey, 'discount'>, Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: 'desc' },
  popular: { soldCount: 'desc' },
  price_asc: { price: 'asc' },
  price_desc: { price: 'desc' },
  rating: { ratingAvg: 'desc' },
};

const LIST_INCLUDE = {
  category: { select: { name: true, slug: true } },
  images: { orderBy: { sortOrder: 'asc' as const } },
  variants: {
    select: { id: true, size: true, color: true, colorHex: true, stock: true },
  },
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(f: ListFilters): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.PUBLISHED,
      ...(f.collection ? COLLECTION_WHERE[f.collection] : {}),
      ...(f.category ? { category: { slug: f.category } } : {}),
      ...(f.fits?.length ? { fit: { in: f.fits } } : {}),
      ...(f.fabrics?.length ? { fabric: { in: f.fabrics } } : {}),
    };

    if (f.minPrice != null || f.maxPrice != null) {
      where.price = {
        ...(f.minPrice != null ? { gte: f.minPrice } : {}),
        ...(f.maxPrice != null ? { lte: f.maxPrice } : {}),
      };
    }

    // Size/color filter on in-stock variants: a product matches when at least
    // one variant satisfies every selected dimension together.
    if (f.sizes?.length || f.colors?.length) {
      where.variants = {
        some: {
          stock: { gt: 0 },
          ...(f.sizes?.length ? { size: { in: f.sizes } } : {}),
          ...(f.colors?.length ? { color: { in: f.colors } } : {}),
        },
      };
    }

    return where;
  }

  async findAll(f: ListFilters) {
    const take = Math.min(Math.max(f.take ?? 24, 1), 48);
    const skip = Math.max(f.skip ?? 0, 0);
    const where = this.buildWhere(f);
    const sort = f.sort ?? (f.collection === 'bestsellers' ? 'popular' : 'newest');

    if (sort === 'discount') {
      // Discount % is computed, not a column — sort the filtered set in JS.
      // Catalog sizes here are small; switch to a raw query if this grows.
      const [all, total] = await this.prisma.$transaction([
        this.prisma.product.findMany({ where, include: LIST_INCLUDE }),
        this.prisma.product.count({ where }),
      ]);
      const items = all
        .sort((a, b) => (1 - b.price / b.mrp) - (1 - a.price / a.mrp))
        .slice(skip, skip + take)
        .map((p) => this.toCard(p));
      return { items, total };
    }

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: LIST_INCLUDE,
        orderBy: SORT_ORDER[sort],
        take,
        skip,
      }),
      this.prisma.product.count({ where }),
    ]);
    return { items: products.map((p) => this.toCard(p)), total };
  }

  /** Available filter values within a category/collection scope. */
  async facets(scope: { category?: string; collection?: Collection }) {
    const where = this.buildWhere(scope);
    const products = await this.prisma.product.findMany({
      where,
      select: {
        price: true,
        fit: true,
        fabric: true,
        variants: {
          where: { stock: { gt: 0 } },
          select: { size: true, color: true, colorHex: true },
        },
      },
    });

    const sizes = new Set<string>();
    const colors = new Map<string, string>();
    const fits = new Set<string>();
    const fabrics = new Set<string>();
    let minPrice = Infinity;
    let maxPrice = 0;

    for (const p of products) {
      fits.add(p.fit);
      if (p.fabric) fabrics.add(p.fabric);
      minPrice = Math.min(minPrice, p.price);
      maxPrice = Math.max(maxPrice, p.price);
      for (const v of p.variants) {
        sizes.add(v.size);
        if (!colors.has(v.color)) colors.set(v.color, v.colorHex);
      }
    }

    const SIZE_ORDER = ['FREE_SIZE', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    return {
      sizes: [...sizes].sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b)),
      colors: [...colors].map(([name, hex]) => ({ name, hex })),
      fits: [...fits],
      fabrics: [...fabrics].sort(),
      priceRange: products.length ? { min: minPrice, max: maxPrice } : { min: 0, max: 0 },
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { orderBy: [{ color: 'asc' }, { size: 'asc' }] },
      },
    });
    if (!product || product.status !== ProductStatus.PUBLISHED) {
      throw new NotFoundException(`Product "${slug}" not found`);
    }
    return product;
  }

  /** Same-category picks, best sellers first, excluding the product itself. */
  async related(slug: string, take = 4) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      select: { id: true, categoryId: true },
    });
    if (!product) throw new NotFoundException(`Product "${slug}" not found`);

    const products = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.PUBLISHED,
        id: { not: product.id },
        ...(product.categoryId ? { categoryId: product.categoryId } : {}),
      },
      include: LIST_INCLUDE,
      orderBy: { soldCount: 'desc' },
      take,
    });
    return products.map((p) => this.toCard(p));
  }

  async categories() {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        _count: { select: { products: { where: { status: 'PUBLISHED' } } } },
      },
    });
  }

  async checkPincode(code: string) {
    const pin = await this.prisma.pincode.findUnique({ where: { pincode: code } });
    if (!pin) {
      return { serviceable: false as const, pincode: code };
    }
    return {
      serviceable: true as const,
      pincode: pin.pincode,
      city: pin.city,
      state: pin.state,
      codAvailable: pin.codAvailable,
      etaMinDays: pin.etaMinDays,
      etaMaxDays: pin.etaMaxDays,
    };
  }

  /** Shape a product for grid/card rendering: primary + hover image, distinct
   *  colors, aggregate stock. Prices stay in paise — the client formats. */
  private toCard(p: {
    id: string; name: string; slug: string; mrp: number; price: number;
    fit: string; badges: string[]; ratingAvg: number; ratingCount: number;
    soldCount: number;
    category: { name: string; slug: string } | null;
    images: { url: string; alt: string | null; color: string | null; isPrimary: boolean; sortOrder: number }[];
    variants: { id: string; size: string; color: string; colorHex: string; stock: number }[];
  }) {
    const primary = p.images.find((i) => i.isPrimary) ?? p.images[0];
    const hover =
      p.images.find((i) => i !== primary && i.color === primary?.color) ??
      p.images.find((i) => i !== primary);

    const colorMap = new Map<string, string>();
    for (const v of p.variants) {
      if (!colorMap.has(v.color)) colorMap.set(v.color, v.colorHex);
    }
    const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      mrp: p.mrp,
      price: p.price,
      discountPercent: p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0,
      fit: p.fit,
      badges: p.badges,
      ratingAvg: p.ratingAvg,
      ratingCount: p.ratingCount,
      category: p.category,
      image: primary ? { url: primary.url, alt: primary.alt ?? p.name } : null,
      hoverImage: hover ? { url: hover.url, alt: hover.alt ?? p.name } : null,
      colors: [...colorMap].map(([name, hex]) => ({ name, hex })),
      // Minimal variant list so cards can offer size-picking Quick Add.
      variants: p.variants.map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        stock: v.stock,
      })),
      totalStock,
      stockLabel:
        totalStock === 0 ? 'SOLD_OUT' : totalStock < 12 ? 'LOW_STOCK' : 'IN_STOCK',
    };
  }
}
