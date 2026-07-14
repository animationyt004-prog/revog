import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

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
      include: { user: { select: { name: true, email: true } } },
    });
    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      isVerifiedPurchase: r.isVerifiedPurchase,
      createdAt: r.createdAt,
      // Never leak full emails: "str…@gmail.com" -> "str***"
      author: r.user.name ?? `${r.user.email.split('@')[0].slice(0, 4)}***`,
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
