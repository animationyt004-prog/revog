import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, ReturnStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

export const RETURN_REASONS = [
  'Size too small',
  'Size too large',
  'Different from photos',
  'Quality not as expected',
  'Wrong item delivered',
  'Damaged / defective',
  'Other',
] as const;

@Injectable()
export class ReturnsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    input: { orderNumber: string; orderItemId?: string; reason: string },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber: input.orderNumber },
      include: { items: true, returns: true },
    });
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found.');
    }
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Returns are available once an order is delivered.');
    }
    if (order.returns.some((r) => r.status !== ReturnStatus.REJECTED)) {
      throw new BadRequestException('A return is already open for this order.');
    }

    let refundAmount = order.total;
    if (input.orderItemId) {
      const item = order.items.find((i) => i.id === input.orderItemId);
      if (!item) throw new BadRequestException('Item not part of this order.');
      refundAmount = item.lineTotal;
    }

    const [request] = await this.prisma.$transaction([
      this.prisma.returnRequest.create({
        data: {
          orderId: order.id,
          orderItemId: input.orderItemId,
          userId,
          reason: input.reason,
          refundAmount,
        },
      }),
      this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.RETURN_REQUESTED,
          events: {
            create: {
              status: OrderStatus.RETURN_REQUESTED,
              note: `Return requested: ${input.reason}`,
            },
          },
        },
      }),
    ]);
    return request;
  }

  listForUser(userId: string) {
    return this.prisma.returnRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { orderNumber: true, total: true } },
        orderItem: { select: { productName: true, variantLabel: true, image: true } },
      },
    });
  }

  // ------------------------------------------------------------- admin

  listAll() {
    return this.prisma.returnRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { orderNumber: true, email: true, total: true, paymentMethod: true } },
        orderItem: { select: { productName: true, variantLabel: true } },
        user: { select: { email: true } },
      },
    });
  }

  /** REQUESTED -> APPROVED -> RECEIVED -> REFUNDED, or REJECTED early. */
  async resolve(id: string, status: ReturnStatus) {
    const request = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: { order: { include: { items: true } } },
    });
    if (!request) throw new NotFoundException('Return request not found.');

    const allowed: Record<string, ReturnStatus[]> = {
      REQUESTED: [ReturnStatus.APPROVED, ReturnStatus.REJECTED],
      APPROVED: [ReturnStatus.RECEIVED, ReturnStatus.REJECTED],
      RECEIVED: [ReturnStatus.REFUNDED],
      REJECTED: [],
      REFUNDED: [],
    };
    if (!allowed[request.status].includes(status)) {
      throw new BadRequestException(`Cannot move return from ${request.status} to ${status}.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.returnRequest.update({
        where: { id },
        data: {
          status,
          resolvedAt:
            status === ReturnStatus.REJECTED || status === ReturnStatus.REFUNDED
              ? new Date()
              : null,
        },
      });

      if (status === ReturnStatus.REJECTED) {
        // Order goes back to its delivered life.
        await tx.order.update({
          where: { id: request.orderId },
          data: {
            status: OrderStatus.DELIVERED,
            events: { create: { status: OrderStatus.DELIVERED, note: 'Return rejected' } },
          },
        });
      }

      if (status === ReturnStatus.RECEIVED) {
        // Item is back — restock it.
        const items = request.orderItemId
          ? request.order.items.filter((i) => i.id === request.orderItemId)
          : request.order.items;
        for (const item of items) {
          if (!item.variantId) continue;
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      if (status === ReturnStatus.REFUNDED) {
        await tx.order.update({
          where: { id: request.orderId },
          data: {
            status: OrderStatus.RETURNED,
            paymentStatus: 'REFUNDED',
            payment: { update: { status: 'REFUNDED' } },
            events: {
              create: {
                status: OrderStatus.RETURNED,
                note: `Refund of ₹${((request.refundAmount ?? 0) / 100).toFixed(0)} processed`,
              },
            },
          },
        });
      }

      return updated;
    }, { timeout: 15_000 });
  }
}
