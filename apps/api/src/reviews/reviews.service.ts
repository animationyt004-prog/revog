import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

/** Reviewer display name when the account has none: never show the raw
 *  handle. "streetwear@gmail.com" -> "stre***", "9924575799" -> "99245***". */
function maskHandle(email: string | null, phone: string | null): string {
  if (email) return `${email.split('@')[0].slice(0, 4)}***`;
  if (phone) return `${phone.slice(0, 5)}***`;
  return 'Verified buyer';
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private async productBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      select: { id: true, ratingAvg: true, ratingCount: true },
    });
    if (!product) throw new NotFoundException('Product not found.');
    return product;
  }

  async list(slug: string) {
    const product = await this.productBySlug(slug);
    const reviews = await this.prisma.review.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true, email: true, phone: true } } },
    });
    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      isVerifiedPurchase: r.isVerifiedPurchase,
      createdAt: r.createdAt,
      // Never leak the full handle: "str…@gmail.com" -> "str***", and for
      // SMS-only accounts fall back to the masked mobile.
      author: r.user.name ?? maskHandle(r.user.email, r.user.phone),
    }));
  }

  /**
   * Recent reviews across the whole catalogue, for the storefront's
   * testimonial rail. Verified purchases only and a body worth quoting — a
   * bare star with no words says nothing to the next shopper, and an
   * unverified one is exactly the sort of thing we refuse to invent.
   */
  async recent(take = 6) {
    const reviews = await this.prisma.review.findMany({
      where: {
        isVerifiedPurchase: true,
        rating: { gte: 4 },
        body: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(take, 12),
      include: {
        user: { select: { name: true, email: true, phone: true } },
        product: { select: { name: true, slug: true } },
      },
    });

    return reviews
      .filter((r) => (r.body ?? '').trim().length >= 20)
      .map((r) => ({
        id: r.id,
        rating: r.rating,
        body: r.body,
        createdAt: r.createdAt,
        product: r.product,
        author: r.user.name ?? maskHandle(r.user.email, r.user.phone),
      }));
  }

  /** Has this user received this product? Drives the verified badge. */
  private async hasDeliveredPurchase(userId: string, productId: string): Promise<boolean> {
    const variants = await this.prisma.productVariant.findMany({
      where: { productId },
      select: { id: true },
    });
    const count = await this.prisma.order.count({
      where: {
        userId,
        status: OrderStatus.DELIVERED,
        items: { some: { variantId: { in: variants.map((v) => v.id) } } },
      },
    });
    return count > 0;
  }

  async upsert(
    slug: string,
    userId: string,
    input: { rating: number; title?: string; body?: string },
  ) {
    const product = await this.productBySlug(slug);
    const verified = await this.hasDeliveredPurchase(userId, product.id);
    const existing = await this.prisma.review.findUnique({
      where: { productId_userId: { productId: product.id, userId } },
    });

    // Keep the product's aggregate in step (seeded history is the baseline).
    const { ratingAvg, ratingCount } = product;
    const nextAgg = existing
      ? {
          ratingAvg:
            ratingCount > 0
              ? (ratingAvg * ratingCount - existing.rating + input.rating) / ratingCount
              : input.rating,
          ratingCount,
        }
      : {
          ratingAvg: (ratingAvg * ratingCount + input.rating) / (ratingCount + 1),
          ratingCount: ratingCount + 1,
        };

    if (input.rating < 1 || input.rating > 5) {
      throw new BadRequestException('Rating must be 1-5.');
    }

    const [review] = await this.prisma.$transaction([
      this.prisma.review.upsert({
        where: { productId_userId: { productId: product.id, userId } },
        create: {
          productId: product.id,
          userId,
          rating: input.rating,
          title: input.title,
          body: input.body,
          isVerifiedPurchase: verified,
        },
        update: {
          rating: input.rating,
          title: input.title,
          body: input.body,
          isVerifiedPurchase: verified,
        },
      }),
      this.prisma.product.update({
        where: { id: product.id },
        data: {
          ratingAvg: Math.round(nextAgg.ratingAvg * 100) / 100,
          ratingCount: nextAgg.ratingCount,
        },
      }),
    ]);
    return { ...review, updated: !!existing };
  }
}
