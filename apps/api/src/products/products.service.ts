import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

export type Collection = 'new' | 'trending' | 'limited' | 'bestsellers';

const COLLECTION_WHERE: Record<Collection, Prisma.ProductWhereInput> = {
  new: { isNewArrival: true },
  trending: { isTrending: true },
  limited: { isLimited: true },
  bestsellers: { isBestSeller: true },
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

  async findAll(opts: {
    collection?: Collection;
    category?: string;
    take?: number;
  }) {
    const take = Math.min(Math.max(opts.take ?? 24, 1), 48);
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.PUBLISHED,
      ...(opts.collection ? COLLECTION_WHERE[opts.collection] : {}),
      ...(opts.category ? { category: { slug: opts.category } } : {}),
    };

    const products = await this.prisma.product.findMany({
      where,
      include: LIST_INCLUDE,
      orderBy: opts.collection === 'bestsellers'
        ? { soldCount: 'desc' }
        : { createdAt: 'desc' },
      take,
    });

    return products.map((p) => this.toCard(p));
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

  /** Shape a product for grid/card rendering: primary + hover image, distinct
   *  colors, aggregate stock. Prices stay in paise — the client formats. */
  private toCard(p: {
    id: string; name: string; slug: string; mrp: number; price: number;
    fit: string; badges: string[]; ratingAvg: number; ratingCount: number;
    soldCount: number;
    category: { name: string; slug: string } | null;
    images: { url: string; alt: string | null; color: string | null; isPrimary: boolean; sortOrder: number }[];
    variants: { size: string; color: string; colorHex: string; stock: number }[];
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
      totalStock,
      stockLabel:
        totalStock === 0 ? 'SOLD_OUT' : totalStock < 12 ? 'LOW_STOCK' : 'IN_STOCK',
    };
  }
}
