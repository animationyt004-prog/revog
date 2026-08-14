import { Injectable } from '@nestjs/common';
import { AnalyticsEventType } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { stripQuery } from './meta-attribution';
import {
  MetaConversionsService,
  type MetaEventName,
} from './meta-conversions.service';

/** Our funnel vocabulary translated to Meta's. Keeping it a total map rather
 *  than a chain of ternaries means a new AnalyticsEventType cannot be added
 *  without deciding what Meta should call it. */
const META_EVENT_NAME: Record<AnalyticsEventType, MetaEventName> = {
  PAGE_VIEW: 'PageView',
  PRODUCT_VIEW: 'ViewContent',
  ADD_TO_CART: 'AddToCart',
  INITIATE_CHECKOUT: 'InitiateCheckout',
  ADD_PAYMENT_INFO: 'AddPaymentInfo',
  LEAD: 'Lead',
};

/** First-party funnel analytics: records lightweight visit/view/add-to-cart
 *  events and aggregates them for the admin Traffic dashboard. */
@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meta: MetaConversionsService,
  ) {}

  async record(e: {
    type: AnalyticsEventType;
    sessionId: string;
    path?: string;
    productId?: string;
    contentId?: string;
    contentIds?: string[];
    contentName?: string;
    value?: number;
    /** Which tender the shopper chose — only meaningful on ADD_PAYMENT_INFO. */
    paymentMethod?: string;
    eventId?: string;
    sourceUrl?: string;
    ip?: string;
    userAgent?: string;
    fbp?: string;
    fbc?: string;
  }): Promise<void> {
    await this.prisma.analyticsEvent.create({
      data: {
        type: e.type,
        sessionId: e.sessionId.slice(0, 64),
        path: e.path?.slice(0, 300) ?? null,
        productId: e.productId ?? null,
      },
    });

    const contentIds = e.contentIds?.length
      ? e.contentIds.slice(0, 100)
      : e.contentId
        ? [e.contentId]
        : undefined;

    await this.meta.send({
      eventName: META_EVENT_NAME[e.type],
      eventId: e.eventId,
      eventSourceUrl: stripQuery(e.sourceUrl),
      userData: {
        clientIpAddress: e.ip,
        clientUserAgent: e.userAgent,
        fbp: e.fbp,
        fbc: e.fbc,
      },
      customData: {
        content_ids: contentIds,
        content_name: e.contentName,
        content_type: contentIds ? 'product' : undefined,
        value: e.value,
        currency: e.value != null ? 'INR' : undefined,
        payment_method: e.paymentMethod,
      },
    });
  }

  /** Aggregated funnel over the last `days` days. */
  async funnel(days: number) {
    const d = Math.min(Math.max(Math.floor(days) || 7, 1), 90);
    const since = new Date(Date.now() - d * 86_400_000);

    const [byType, orders, distinct, returning, topRaw] = await Promise.all([
      this.prisma.analyticsEvent.groupBy({
        by: ['type'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      }),
      this.prisma.order.count({ where: { placedAt: { gte: since } } }),
      this.prisma.$queryRaw<{ n: number }[]>`
        SELECT COUNT(DISTINCT "sessionId")::int AS n
        FROM "AnalyticsEvent" WHERE "createdAt" >= ${since}`,
      this.prisma.$queryRaw<{ n: number }[]>`
        SELECT COUNT(*)::int AS n FROM (
          SELECT "sessionId" FROM "AnalyticsEvent"
          WHERE "createdAt" >= ${since}
          GROUP BY "sessionId"
          HAVING COUNT(DISTINCT DATE("createdAt")) > 1
        ) t`,
      this.prisma.analyticsEvent.groupBy({
        by: ['productId'],
        where: {
          type: 'PRODUCT_VIEW',
          createdAt: { gte: since },
          productId: { not: null },
        },
        _count: { _all: true },
        orderBy: { _count: { productId: 'desc' } },
        take: 5,
      }),
    ]);

    const count = (t: AnalyticsEventType) =>
      byType.find((b) => b.type === t)?._count._all ?? 0;

    const ids = topRaw.map((t) => t.productId).filter((x): x is string => !!x);
    const products = ids.length
      ? await this.prisma.product.findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true, slug: true },
        })
      : [];
    const byId = new Map(products.map((p) => [p.id, p]));

    const productViews = count('PRODUCT_VIEW');
    const addToCarts = count('ADD_TO_CART');

    return {
      days: d,
      visitors: distinct[0]?.n ?? 0,
      returningVisitors: returning[0]?.n ?? 0,
      pageViews: count('PAGE_VIEW'),
      productViews,
      addToCarts,
      orders,
      viewToCartRate: productViews
        ? Math.round((addToCarts / productViews) * 100)
        : 0,
      cartToOrderRate: addToCarts ? Math.round((orders / addToCarts) * 100) : 0,
      topProducts: topRaw.map((t) => ({
        productId: t.productId,
        name: t.productId
          ? (byId.get(t.productId)?.name ?? 'Unknown')
          : 'Unknown',
        slug: t.productId ? (byId.get(t.productId)?.slug ?? '') : '',
        views: t._count._all,
      })),
    };
  }
}
