import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Badge,
  Fit,
  Gender,
  OrderStatus,
  Prisma,
  ProductStatus,
  Size,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';

/** Default resell markup (paise) — cost + this = default selling price. */
export const RESELL_MARKUP = 20000; // ₹200

/** Normal fulfilment flow plus controlled corrections for accidental delivery
 *  marks. Every correction is recorded in the order event timeline. */
const NEXT_STATUSES: Record<string, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PACKED, OrderStatus.CANCELLED],
  PACKED: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  DELIVERED: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  CANCELLED: [],
  RETURN_REQUESTED: [OrderStatus.RETURNED],
  RETURNED: [],
};

const LOW_STOCK_THRESHOLD = 5;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ------------------------------------------------------------ dashboard

  async dashboard() {
    const activeOrders = {
      status: { notIn: [OrderStatus.CANCELLED] as OrderStatus[] },
    };
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      revenue,
      orderCount,
      todayCount,
      customerCount,
      lowStock,
      recentOrders,
      statusCounts,
    ] = await this.prisma.$transaction([
      this.prisma.order.aggregate({
        where: activeOrders,
        _sum: { total: true },
      }),
      this.prisma.order.count({ where: activeOrders }),
      this.prisma.order.count({
        where: { ...activeOrders, placedAt: { gte: startOfToday } },
      }),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.productVariant.findMany({
        where: {
          stock: { lte: LOW_STOCK_THRESHOLD },
          product: { status: ProductStatus.PUBLISHED },
        },
        orderBy: { stock: 'asc' },
        take: 10,
        select: {
          id: true,
          sku: true,
          size: true,
          color: true,
          stock: true,
          product: { select: { name: true, slug: true } },
        },
      }),
      this.prisma.order.findMany({
        orderBy: { placedAt: 'desc' },
        take: 8,
        select: {
          id: true,
          orderNumber: true,
          email: true,
          status: true,
          paymentMethod: true,
          total: true,
          placedAt: true,
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        _count: true,
        orderBy: { status: 'asc' },
      }),
    ]);

    return {
      revenue: revenue._sum.total ?? 0,
      orderCount,
      todayCount,
      customerCount,
      lowStock,
      recentOrders,
      statusCounts: Object.fromEntries(
        statusCounts.map((s) => [s.status, s._count]),
      ),
    };
  }

  // --------------------------------------------------------------- orders

  async listOrders(opts: {
    status?: OrderStatus;
    q?: string;
    take?: number;
    skip?: number;
  }) {
    const where: Prisma.OrderWhereInput = {
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.q
        ? {
            OR: [
              { orderNumber: { contains: opts.q, mode: 'insensitive' } },
              { email: { contains: opts.q, mode: 'insensitive' } },
              { phone: { contains: opts.q } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { placedAt: 'desc' },
        take: Math.min(opts.take ?? 25, 100),
        skip: opts.skip ?? 0,
        include: {
          items: true,
          payment: { select: { method: true, status: true } },
          events: { orderBy: { createdAt: 'desc' } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, total };
  }

  async orderDetail(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        payment: true,
        events: { orderBy: { createdAt: 'asc' } },
        user: { select: { id: true, email: true, name: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found.');
    return order;
  }

  async advanceOrder(
    orderNumber: string,
    status: OrderStatus,
    note?: string,
    tracking?: {
      courier?: string;
      trackingNumber?: string;
      trackingUrl?: string | null;
      estimatedDeliveryAt?: string;
      revisedDeliveryAt?: string | null;
    },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found.');

    const allowed = NEXT_STATUSES[order.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot move ${order.orderNumber} from ${order.status} to ${status}.`,
      );
    }

    const deliveredCorrection = order.status === OrderStatus.DELIVERED;
    if (deliveredCorrection && !note?.trim()) {
      throw new BadRequestException(
        'A reason is required when changing a delivered order.',
      );
    }

    const effectiveCourier = tracking?.courier?.trim() || order.courier;
    const effectiveTrackingNumber =
      tracking?.trackingNumber?.trim() || order.trackingNumber;
    const effectiveEstimate =
      tracking?.estimatedDeliveryAt ??
      order.revisedDeliveryAt?.toISOString() ??
      order.estimatedDeliveryAt?.toISOString();

    if (status === OrderStatus.SHIPPED) {
      if (!effectiveCourier || !effectiveTrackingNumber) {
        throw new BadRequestException(
          'Courier and tracking number are required to mark an order shipped.',
        );
      }
      if (!effectiveEstimate) {
        throw new BadRequestException(
          'Expected delivery date is required to mark an order shipped.',
        );
      }
      const estimate = tracking?.estimatedDeliveryAt
        ? new Date(tracking.estimatedDeliveryAt)
        : order.estimatedDeliveryAt;
      const revision =
        tracking?.revisedDeliveryAt === undefined
          ? order.revisedDeliveryAt
          : tracking.revisedDeliveryAt
            ? new Date(tracking.revisedDeliveryAt)
            : null;
      if (estimate && revision && revision < estimate) {
        throw new BadRequestException(
          'Revised delivery cannot be earlier than the original estimate.',
        );
      }
    }

    // Existing details survive a Delivered -> Shipped correction unless the
    // admin supplies replacements in the correction form.
    const shipData =
      status === OrderStatus.SHIPPED
        ? {
            courier: effectiveCourier,
            trackingNumber: effectiveTrackingNumber,
            trackingUrl:
              tracking?.trackingUrl === undefined
                ? order.trackingUrl
                : tracking.trackingUrl?.trim() || null,
            estimatedDeliveryAt: tracking?.estimatedDeliveryAt
              ? new Date(tracking.estimatedDeliveryAt)
              : order.estimatedDeliveryAt,
            revisedDeliveryAt:
              tracking?.revisedDeliveryAt === undefined
                ? order.revisedDeliveryAt
                : tracking.revisedDeliveryAt
                  ? new Date(tracking.revisedDeliveryAt)
                  : null,
            shipmentUpdatedAt: new Date(),
          }
        : {};
    const shipNote =
      status === OrderStatus.SHIPPED && effectiveTrackingNumber
        ? `${deliveredCorrection ? 'Shipment reopened' : 'Shipped'} via ${effectiveCourier} | AWB ${effectiveTrackingNumber}`
        : undefined;

    return this.prisma.$transaction(
      async (tx) => {
        // Pre-delivery cancellation puts stock back on the shelf. A delivered
        // override does not: physical return intake owns that inventory.
        if (
          status === OrderStatus.CANCELLED &&
          order.status !== OrderStatus.DELIVERED
        ) {
          for (const item of order.items) {
            if (!item.variantId) continue;
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
            await tx.product.updateMany({
              where: { variants: { some: { id: item.variantId } } },
              data: { soldCount: { decrement: item.quantity } },
            });
          }
        }
        // COD money is collected at the door.
        const paymentPaid =
          status === OrderStatus.DELIVERED && order.paymentMethod === 'COD'
            ? {
                paymentStatus: 'PAID' as const,
                payment: { update: { status: 'PAID' as const } },
              }
            : {};

        // A mistaken COD delivery mark also marked the payment paid. Reopening
        // restores its pre-delivery payment state; prepaid money stays paid.
        const reopenedCodPayment =
          deliveredCorrection &&
          status === OrderStatus.SHIPPED &&
          order.paymentMethod === 'COD'
            ? {
                paymentStatus: 'PENDING' as const,
                payment: { update: { status: 'PENDING' as const } },
              }
            : {};

        return tx.order.update({
          where: { id: order.id },
          data: {
            status,
            ...paymentPaid,
            ...reopenedCodPayment,
            ...shipData,
            events: {
              create: {
                status,
                note: note ?? shipNote ?? `Status updated to ${status}`,
              },
            },
          },
          include: {
            items: true,
            events: { orderBy: { createdAt: 'asc' } },
            payment: true,
          },
        });
      },
      { timeout: 15_000 },
    );
  }

  async updateShipment(
    orderNumber: string,
    input: {
      courier: string;
      trackingNumber: string;
      trackingUrl?: string | null;
      estimatedDeliveryAt: string;
      revisedDeliveryAt?: string | null;
      note?: string;
    },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
    });
    if (!order) throw new NotFoundException('Order not found.');
    if (
      order.status !== OrderStatus.SHIPPED &&
      order.status !== OrderStatus.DELIVERED
    ) {
      throw new BadRequestException(
        'Shipment details can only be updated after an order is shipped.',
      );
    }

    const estimate = new Date(input.estimatedDeliveryAt);
    const revision = input.revisedDeliveryAt
      ? new Date(input.revisedDeliveryAt)
      : null;
    if (revision && revision < estimate) {
      throw new BadRequestException(
        'Revised delivery cannot be earlier than the original estimate.',
      );
    }
    const deliveryNote = revision
      ? `Revised delivery: ${revision.toLocaleDateString('en-IN')}`
      : `Expected delivery: ${estimate.toLocaleDateString('en-IN')}`;

    return this.prisma.order.update({
      where: { id: order.id },
      data: {
        courier: input.courier.trim(),
        trackingNumber: input.trackingNumber.trim(),
        trackingUrl: input.trackingUrl?.trim() || null,
        estimatedDeliveryAt: estimate,
        revisedDeliveryAt: revision,
        shipmentUpdatedAt: new Date(),
        events: {
          create: {
            status: order.status,
            note:
              input.note?.trim() ||
              `Shipment details updated | ${deliveryNote}`,
          },
        },
      },
      include: {
        items: true,
        events: { orderBy: { createdAt: 'asc' } },
        payment: true,
      },
    });
  }

  // ------------------------------------------------------------- products

  /** slugify + de-dupe against existing products. */
  private async uniqueSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'product';
    let slug = base;
    for (
      let i = 2;
      await this.prisma.product.findUnique({ where: { slug } });
      i++
    ) {
      slug = `${base}-${i}`;
    }
    return slug;
  }

  /** Create a resell product. price/mrp arrive in paise (client applies the
   *  +₹200 markup to the maxzone cost, but the final price is passed in so it
   *  stays editable). One image URL, colour list × size list → variants. */
  async createProduct(data: {
    name: string;
    categorySlug: string;
    price: number;
    mrp: number;
    description?: string;
    fit: Fit;
    gender?: Gender;
    fabric?: string;
    images: { url: string; color?: string }[];
    colors: { name: string; hex: string }[];
    sizes: Size[];
    stock: number;
    badges: Badge[];
    publish: boolean;
  }) {
    if (data.price < 100)
      throw new BadRequestException('Price must be at least ₹1.');
    if (data.mrp < data.price)
      throw new BadRequestException('MRP cannot be below selling price.');
    if (data.colors.length === 0)
      throw new BadRequestException('Add at least one colour.');
    if (data.sizes.length === 0)
      throw new BadRequestException('Pick at least one size.');
    if (data.images.length === 0)
      throw new BadRequestException('Add at least one image.');

    const category = await this.prisma.category.findUnique({
      where: { slug: data.categorySlug },
      select: { id: true },
    });
    if (!category) throw new BadRequestException('Category not found.');

    // A photo tagged with a colour that has no variant would never be shown:
    // both the gallery and the ad feeds look images up by variant colour.
    const colorNames = new Set(data.colors.map((c) => c.name.trim()));
    for (const img of data.images) {
      const tag = img.color?.trim();
      if (tag && !colorNames.has(tag)) {
        throw new BadRequestException(
          `Photo colour "${tag}" is not one of this product's colours.`,
        );
      }
    }

    const slug = await this.uniqueSlug(data.name);
    const skuBase = `RS-${randomBytes(3).toString('hex').toUpperCase()}`;

    return this.prisma.product.create({
      data: {
        name: data.name.trim(),
        slug,
        description:
          data.description?.trim() ||
          `${data.name.trim()} — available at HyraLuxe.`,
        gender: data.gender ?? 'WOMEN',
        fit: data.fit,
        fabric: data.fabric?.trim() || null,
        status: data.publish ? ProductStatus.PUBLISHED : ProductStatus.DRAFT,
        mrp: data.mrp,
        price: data.price,
        categoryId: category.id,
        badges: data.badges,
        isNewArrival: true,
        metaTitle: `${data.name.trim()} | HyraLuxe`,
        metaDescription: (data.description?.trim() || data.name.trim()).slice(
          0,
          155,
        ),
        images: {
          // Each photo keeps the colour it actually shows, and the first photo
          // of every colour becomes that colour's primary. Tagging the whole
          // gallery with colors[0] made every other colour fall back to the
          // first colour's picture — in the product page and, worse, in the ad
          // feeds, where a maroon saree then advertised as teal.
          create: data.images.map((img, i) => {
            const color = img.color?.trim() || data.colors[0].name;
            const firstOfColor =
              data.images.findIndex(
                (other) =>
                  (other.color?.trim() || data.colors[0].name) === color,
              ) === i;
            return {
              url: img.url.trim(),
              alt: `${data.name.trim()} — ${color}`,
              color,
              sortOrder: i,
              isPrimary: firstOfColor,
            };
          }),
        },
        variants: {
          create: data.colors.flatMap((c) =>
            data.sizes.map((size) => ({
              sku: `${skuBase}-${c.name.replace(/\s+/g, '').toUpperCase().slice(0, 6)}-${size}`,
              size,
              color: c.name,
              colorHex: c.hex,
              stock: data.stock,
            })),
          ),
        },
      },
      select: { id: true, slug: true, name: true, status: true },
    });
  }

  async listProducts() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { name: true, slug: true } },
        variants: { orderBy: [{ color: 'asc' }, { size: 'asc' }] },
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      },
    });
  }

  async updateProduct(
    id: string,
    data: {
      price?: number;
      mrp?: number;
      status?: ProductStatus;
      isNewArrival?: boolean;
      isTrending?: boolean;
      isLimited?: boolean;
      isBestSeller?: boolean;
    },
  ) {
    if (data.price != null && data.mrp != null && data.price > data.mrp) {
      throw new BadRequestException('Price cannot exceed MRP.');
    }
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found.');
    if (
      (data.price != null && data.mrp == null && data.price > existing.mrp) ||
      (data.mrp != null && data.price == null && existing.price > data.mrp)
    ) {
      throw new BadRequestException('Price cannot exceed MRP.');
    }
    return this.prisma.product.update({ where: { id }, data });
  }

  async deleteProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        variants: { select: { id: true, stock: true } },
      },
    });
    if (!product) throw new NotFoundException('Product not found.');

    const totalStock = product.variants.reduce(
      (sum, variant) => sum + variant.stock,
      0,
    );
    if (totalStock > 0) {
      throw new BadRequestException(
        'Only products with zero total stock can be permanently deleted.',
      );
    }

    const variantIds = product.variants.map((variant) => variant.id);
    await this.prisma.$transaction(async (tx) => {
      // Order items keep frozen product/price/image snapshots. Detaching the
      // optional variant reference preserves that history before variants go.
      if (variantIds.length) {
        await tx.orderItem.updateMany({
          where: { variantId: { in: variantIds } },
          data: { variantId: null },
        });
      }
      await tx.product.delete({ where: { id: product.id } });
    });

    return {
      deleted: true,
      id: product.id,
      slug: product.slug,
      name: product.name,
    };
  }

  async updateVariantStock(variantId: string, stock: number) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) throw new NotFoundException('Variant not found.');
    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: { stock },
    });
  }

  // -------------------------------------------------------------- coupons

  listCoupons() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createCoupon(data: {
    code: string;
    description?: string;
    type: 'PERCENT' | 'FLAT';
    value: number;
    minCartValue?: number;
    maxDiscount?: number;
    usageLimit?: number;
    perUserLimit?: number;
    expiresAt?: string;
  }) {
    const code = data.code.toUpperCase().trim();
    const existing = await this.prisma.coupon.findUnique({ where: { code } });
    if (existing)
      throw new BadRequestException(`Coupon ${code} already exists.`);
    if (data.type === 'PERCENT' && (data.value < 1 || data.value > 90)) {
      throw new BadRequestException('Percent coupons must be 1-90%.');
    }
    return this.prisma.coupon.create({
      data: {
        code,
        description: data.description,
        type: data.type,
        value: data.value,
        minCartValue: data.minCartValue ?? 0,
        maxDiscount: data.maxDiscount,
        usageLimit: data.usageLimit,
        perUserLimit: data.perUserLimit ?? 1,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });
  }

  async toggleCoupon(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found.');
    return this.prisma.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    });
  }

  // ------------------------------------------------------------ customers

  async listCustomers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        orders: { select: { total: true, status: true } },
      },
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      phone: u.phone,
      role: u.role,
      createdAt: u.createdAt,
      orderCount: u.orders.length,
      lifetimeValue: u.orders
        .filter((o) => o.status !== 'CANCELLED')
        .reduce((s, o) => s + o.total, 0),
    }));
  }
}
