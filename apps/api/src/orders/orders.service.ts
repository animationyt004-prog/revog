import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { randomInt } from 'crypto';
import { CartService } from '../cart/cart.service';
import { PaymentsService } from '../payments/payments.service';
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
    private readonly payments: PaymentsService,
  ) {}

  private newOrderNumber(): string {
    // RV-<base36 minute stamp>-<3 random digits> — short, sortable, unguessable enough.
    const stamp = Math.floor(Date.now() / 60000).toString(36).toUpperCase();
    return `RV-${stamp}-${randomInt(100, 1000)}`;
  }

  /** Checkout: everything stock-critical happens inside one transaction.
   *  COD confirms immediately; RAZORPAY creates a PENDING order plus a
   *  gateway order for the modal, confirmed later by signature verification. */
  async checkout(opts: {
    cartToken: string;
    userId?: string;
    email: string;
    address: ShippingAddress;
    paymentMethod: PaymentMethod;
  }) {
    const raw = await this.cart.findRaw(opts.cartToken);
    if (!raw || raw.items.length === 0) {
      throw new BadRequestException('Your cart is empty.');
    }
    const view = await this.cart.view(raw);
    const { summary } = view;

    const isCod = opts.paymentMethod === PaymentMethod.COD;
    const orderNumber = this.newOrderNumber();
    // Gateway order first: if Razorpay is down we fail before touching stock.
    // An orphaned (never-paid) gateway order is harmless.
    const razorpayOrderId = isCod
      ? null
      : await this.payments.createGatewayOrder(summary.total, orderNumber);

    const order = await this.prisma.$transaction(
      async (tx) => {
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
          orderNumber,
          userId: opts.userId ?? null,
          email: opts.email.toLowerCase(),
          phone: opts.address.phone,
          // COD confirms immediately; online payment confirms on verify.
          status: isCod ? OrderStatus.CONFIRMED : OrderStatus.PENDING,
          paymentMethod: opts.paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
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
              method: opts.paymentMethod,
              status: PaymentStatus.PENDING,
              amount: summary.total,
              razorpayOrderId,
            },
          },
          events: {
            create: isCod
              ? {
                  status: OrderStatus.CONFIRMED,
                  note: 'Order placed — Cash on Delivery',
                }
              : {
                  status: OrderStatus.PENDING,
                  note: 'Order placed — awaiting online payment',
                },
          },
        },
        include: ORDER_INCLUDE,
      });

      // 4. Empty the cart.
      await tx.cartItem.deleteMany({ where: { cartId: raw.id } });
      await tx.cart.update({ where: { id: raw.id }, data: { couponCode: null } });

      return created;
      },
      // Checkout spans several round-trips; from a dev machine far from the DB
      // region the default 5s expires. Production (same-region) runs in <1s.
      { timeout: 20_000, maxWait: 5_000 },
    );

    return {
      ...order,
      // Frontend opens the Razorpay modal with this (null for COD).
      razorpay: razorpayOrderId
        ? {
            keyId: this.payments.keyId,
            razorpayOrderId,
            amount: summary.total,
            currency: 'INR' as const,
          }
        : null,
    };
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
