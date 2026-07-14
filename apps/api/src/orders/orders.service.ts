import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { randomInt } from 'crypto';
import { CartService } from '../cart/cart.service';
import { PrismaService } from '../common/prisma/prisma.service';

export interface ShippingAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

const ORDER_INCLUDE = {
  items: true,
  payment: { select: { method: true, status: true, amount: true } },
  events: { orderBy: { createdAt: 'asc' as const } },
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cart: CartService,
  ) {}

  private newOrderNumber(): string {
    // RV-<base36 minute stamp>-<3 random digits> — short, sortable, unguessable enough.
    const stamp = Math.floor(Date.now() / 60000).toString(36).toUpperCase();
    return `RV-${stamp}-${randomInt(100, 1000)}`;
  }

  /** COD checkout: everything stock-critical happens inside one transaction. */
  async checkout(opts: {
    cartToken: string;
    userId?: string;
    email: string;
    address: ShippingAddress;
  }) {
    const raw = await this.cart.findRaw(opts.cartToken);
    if (!raw || raw.items.length === 0) {
      throw new BadRequestException('Your cart is empty.');
    }
    const view = await this.cart.view(raw);
    const { summary } = view;

    const order = await this.prisma.$transaction(async (tx) => {
      // 1. Atomically decrement stock; a 0-count update means someone beat us.
      for (const item of view.items) {
        const updated = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new BadRequestException(
            `"${item.name}" (${item.color} / ${item.size}) just sold out in the quantity you wanted.`,
          );
        }
        await tx.product.updateMany({
          where: { slug: item.slug },
          data: { soldCount: { increment: item.quantity } },
        });
      }

      // 2. Redeem the coupon within the same transaction.
      if (summary.couponCode) {
        const redeemed = await tx.coupon.updateMany({
          where: {
            code: summary.couponCode,
            isActive: true,
            OR: [{ usageLimit: null }, { usedCount: { lt: this.prisma.coupon.fields.usageLimit } }],
          },
          data: { usedCount: { increment: 1 } },
        });
        if (redeemed.count === 0) {
          throw new BadRequestException('Coupon is no longer valid.');
        }
      }

      // 3. Create the order with full snapshots.
      const created = await tx.order.create({
        data: {
          orderNumber: this.newOrderNumber(),
          userId: opts.userId ?? null,
          email: opts.email.toLowerCase(),
          phone: opts.address.phone,
          status: OrderStatus.CONFIRMED, // COD confirms immediately
          paymentMethod: PaymentMethod.COD,
          paymentStatus: PaymentStatus.PENDING, // collected on delivery
          subtotal: summary.subtotal,
          discount: summary.couponDiscount,
          shippingFee: summary.shippingFee,
          taxAmount: summary.taxIncluded,
          total: summary.total,
          couponCode: summary.couponCode,
          addressSnapshot: opts.address as unknown as Prisma.InputJsonValue,
          items: {
            create: view.items.map((i) => ({
              variantId: i.variantId,
              productName: i.name,
              variantLabel: `${i.color} / ${i.size}`,
              image: i.image,
              unitPrice: i.unitPrice,
              quantity: i.quantity,
              lineTotal: i.lineTotal,
            })),
          },
          payment: {
            create: {
              method: PaymentMethod.COD,
              status: PaymentStatus.PENDING,
              amount: summary.total,
            },
          },
          events: {
            create: {
              status: OrderStatus.CONFIRMED,
              note: 'Order placed — Cash on Delivery',
            },
          },
        },
        include: ORDER_INCLUDE,
      });

      // 4. Empty the cart.
      await tx.cartItem.deleteMany({ where: { cartId: raw.id } });
      await tx.cart.update({ where: { id: raw.id }, data: { couponCode: null } });

      return created;
    });

    return order;
  }

  async listForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { placedAt: 'desc' },
      include: { items: true },
    });
  }

  /** Fetch one order. Owners fetch by number; guests must also match email. */
  async findByNumber(orderNumber: string, viewer: { userId?: string; email?: string }) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Order not found.');

    const ownsIt = viewer.userId && order.userId === viewer.userId;
    const emailMatches =
      viewer.email && order.email === viewer.email.toLowerCase();
    if (!ownsIt && !emailMatches) {
      throw new ForbiddenException('Not allowed to view this order.');
    }
    return order;
  }
}
