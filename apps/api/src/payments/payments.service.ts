import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';
import Razorpay from 'razorpay';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly client: Razorpay;
  private readonly keySecret: string;
  private readonly webhookSecret: string | undefined;
  readonly keyId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.keyId = config.getOrThrow<string>('RAZORPAY_KEY_ID');
    this.keySecret = config.getOrThrow<string>('RAZORPAY_KEY_SECRET');
    this.webhookSecret = config.get<string>('RAZORPAY_WEBHOOK_SECRET') || undefined;
    this.client = new Razorpay({ key_id: this.keyId, key_secret: this.keySecret });
  }

  /** Create the Razorpay order that the checkout modal will collect against. */
  async createGatewayOrder(amountPaise: number, receipt: string): Promise<string> {
    if (amountPaise < 100) {
      throw new BadRequestException('Order amount must be at least ₹1.');
    }
    const rpOrder = await this.client.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
    });
    return rpOrder.id;
  }

  private signatureMatches(orderId: string, paymentId: string, signature: string): boolean {
    const expected = createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  }

  /** Confirm an internal order after verifying Razorpay's signature. */
  async verify(input: {
    orderNumber: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber: input.orderNumber },
      include: { payment: true },
    });
    if (!order || !order.payment) throw new NotFoundException('Order not found.');

    // Idempotent: a repeated callback for an already-paid order is fine.
    if (order.paymentStatus === PaymentStatus.PAID) {
      return { ok: true, orderNumber: order.orderNumber, status: order.status };
    }

    if (order.payment.razorpayOrderId !== input.razorpayOrderId) {
      throw new BadRequestException('Payment does not belong to this order.');
    }
    if (
      !this.signatureMatches(
        input.razorpayOrderId,
        input.razorpayPaymentId,
        input.razorpaySignature,
      )
    ) {
      this.logger.warn(`Signature mismatch for order ${order.orderNumber}`);
      throw new BadRequestException('Payment verification failed.');
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        payment: {
          update: {
            status: PaymentStatus.PAID,
            razorpayPaymentId: input.razorpayPaymentId,
            razorpaySignature: input.razorpaySignature,
            failureReason: null,
          },
        },
        events: {
          create: {
            status: OrderStatus.CONFIRMED,
            note: 'Payment received via Razorpay',
          },
        },
      },
    });
    return { ok: true, orderNumber: updated.orderNumber, status: updated.status };
  }

  /**
   * Record a failed attempt and put the stock back.
   *
   * Checkout decrements stock when it creates the order, before the gateway
   * has taken anything — that is what stops two people buying the last piece
   * at once. When the payment then fails, those units have to return, or every
   * abandoned card attempt quietly retires inventory that was never sold.
   *
   * The order is left CANCELLED rather than PENDING: its stock is no longer
   * held, so "retry" would have nothing reserved behind it. A shopper who
   * still wants the piece adds it to the cart again.
   */
  async recordFailure(orderNumber: string, reason: string | undefined, email?: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { payment: true, items: true },
    });
    if (!order || !order.payment) throw new NotFoundException('Order not found.');
    if (email && order.email !== email.toLowerCase()) {
      throw new BadRequestException('Order does not match.');
    }
    if (order.paymentStatus === PaymentStatus.PAID) return { ok: true };
    // Already released — a second failure callback must not double-restock.
    if (order.status === OrderStatus.CANCELLED) return { ok: true };

    await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        // variantId is nullable: a variant deleted since the order was placed
        // leaves the line for the record but has no stock to return.
        if (!item.variantId) continue;
        await tx.productVariant.updateMany({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }
      await tx.payment.update({
        where: { id: order.payment!.id },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: reason?.slice(0, 300) ?? 'Payment failed',
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          events: {
            create: {
              status: OrderStatus.CANCELLED,
              note: 'Payment failed — stock returned',
            },
          },
        },
      });
    });
    return { ok: true };
  }

  /**
   * Razorpay's server-to-server callback.
   *
   * The browser's /verify call is best-effort: a shopper whose tab closes or
   * whose network drops between paying and returning leaves an order PENDING
   * while Razorpay holds their money. This is the side that does not depend on
   * their device staying alive, so it is the one that decides.
   *
   * Proof here is the webhook signature over the raw payload, not the
   * checkout signature — the shopper's browser is not involved.
   */
  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    if (!this.webhookSecret) {
      // Refuse rather than trust an unsigned caller: without the secret this
      // endpoint would confirm orders for anyone who found the URL.
      this.logger.error('Webhook received but RAZORPAY_WEBHOOK_SECRET is unset');
      throw new BadRequestException('Webhook not configured.');
    }
    if (!signature) throw new BadRequestException('Missing signature.');

    const expected = createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      this.logger.warn('Webhook signature mismatch');
      throw new BadRequestException('Invalid signature.');
    }

    const event = JSON.parse(rawBody.toString('utf8')) as {
      event?: string;
      payload?: {
        payment?: {
          entity?: { id?: string; order_id?: string; error_description?: string };
        };
      };
    };
    const payment = event.payload?.payment?.entity;
    if (!payment?.order_id || !payment.id) return { ok: true, ignored: true };

    const record = await this.prisma.payment.findFirst({
      where: { razorpayOrderId: payment.order_id },
      include: { order: true },
    });
    // An unknown gateway order is not our problem to solve, and answering 2xx
    // stops Razorpay retrying it forever.
    if (!record?.order) return { ok: true, ignored: true };

    if (event.event === 'payment.captured') {
      await this.confirmPaid(record.order.id, record.id, payment.id);
      return { ok: true, handled: 'payment.captured' };
    }
    if (event.event === 'payment.failed') {
      await this.recordFailure(record.order.orderNumber, payment.error_description);
      return { ok: true, handled: 'payment.failed' };
    }
    return { ok: true, ignored: true };
  }

  /** Mark an order paid. Shared by the browser callback and the webhook, so
   *  whichever arrives first wins and the second is a no-op. */
  private async confirmPaid(orderId: string, paymentId: string, razorpayPaymentId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.paymentStatus === PaymentStatus.PAID) return;

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        payment: {
          update: {
            status: PaymentStatus.PAID,
            razorpayPaymentId,
            failureReason: null,
          },
        },
        events: {
          create: {
            status: OrderStatus.CONFIRMED,
            note: 'Payment confirmed by Razorpay webhook',
          },
        },
      },
    });
    this.logger.log(`Order ${order.orderNumber} confirmed via webhook`);
  }

  /** Details needed to (re)open the checkout modal for a pending order. */
  async session(orderNumber: string, email: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { payment: true },
    });
    if (!order || !order.payment?.razorpayOrderId) {
      throw new NotFoundException('No payment session for this order.');
    }
    if (order.email !== email.toLowerCase()) {
      throw new BadRequestException('Order does not match.');
    }
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid.');
    }
    return {
      keyId: this.keyId,
      razorpayOrderId: order.payment.razorpayOrderId,
      amount: order.total,
      currency: 'INR',
      orderNumber: order.orderNumber,
      email: order.email,
      phone: order.phone,
    };
  }
}
