import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

/** Forward-only pipeline; CANCELLED allowed from any pre-delivery state. */
const NEXT_STATUSES: Record<string, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PACKED, OrderStatus.CANCELLED],
  PACKED: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  DELIVERED: [],
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
    const activeOrders = { status: { notIn: [OrderStatus.CANCELLED] as OrderStatus[] } };
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [revenue, orderCount, todayCount, customerCount, lowStock, recentOrders, statusCounts] =
      await this.prisma.$transaction([
        this.prisma.order.aggregate({ where: activeOrders, _sum: { total: true } }),
        this.prisma.order.count({ where: activeOrders }),
        this.prisma.order.count({ where: { ...activeOrders, placedAt: { gte: startOfToday } } }),
        this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
        this.prisma.productVariant.findMany({
          where: { stock: { lte: LOW_STOCK_THRESHOLD }, product: { status: ProductStatus.PUBLISHED } },
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
      statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count])),
    };
  }

  // --------------------------------------------------------------- orders

  async listOrders(opts: { status?: OrderStatus; q?: string; take?: number; skip?: number }) {
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
        include: { items: true, payment: { select: { method: true, status: true } } },
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

  async advanceOrder(orderNumber: string, status: OrderStatus, note?: string) {
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

    return this.prisma.$transaction(async (tx) => {
      // Cancelling puts sold stock back on the shelf.
      if (status === OrderStatus.CANCELLED) {
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
          ? { paymentStatus: 'PAID' as const, payment: { update: { status: 'PAID' as const } } }
          : {};

      return tx.order.update({
        where: { id: order.id },
        data: {
          status,
          ...paymentPaid,
          events: { create: { status, note: note ?? `Status updated to ${status}` } },
        },
        include: { items: true, events: { orderBy: { createdAt: 'asc' } }, payment: true },
      });
    }, { timeout: 15_000 });
  }

  // ------------------------------------------------------------- products

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

  async updateVariantStock(variantId: string, stock: number) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
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
    if (existing) throw new BadRequestException(`Coupon ${code} already exists.`);
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
