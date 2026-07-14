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
  readonly keyId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.keyId = config.getOrThrow<string>('RAZORPAY_KEY_ID');
    this.keySecret = config.getOrThrow<string>('RAZORPAY_KEY_SECRET');
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

  /** Record a failed attempt; order stays PENDING for retry. */
  async recordFailure(orderNumber: string, reason: string | undefined, email?: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { payment: true },
    });
    if (!order || !order.payment) throw new NotFoundException('Order not found.');
    if (email && order.email !== email.toLowerCase()) {
      throw new BadRequestException('Order does not match.');
    }
    if (order.paymentStatus === PaymentStatus.PAID) return { ok: true };

    await this.prisma.payment.update({
      where: { id: order.payment.id },
      data: {
        status: PaymentStatus.FAILED,
        failureReason: reason?.slice(0, 300) ?? 'Payment failed',
      },
    });
    return { ok: true };
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
