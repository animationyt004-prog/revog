import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Coupon, CouponType } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';

export const FREE_SHIPPING_THRESHOLD = 99900; // ₹999 in paise
export const SHIPPING_FEE = 9900; // ₹99
export const GST_RATE = 18; // % — prices are GST-INCLUSIVE (Indian retail norm)
const MAX_QTY_PER_LINE = 10;

const CART_INCLUDE = {
  items: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      variant: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              price: true,
              mrp: true,
              images: { orderBy: { sortOrder: 'asc' as const }, take: 6 },
            },
          },
        },
      },
    },
  },
};

type CartWithItems = NonNullable<
  Awaited<ReturnType<CartService['findRaw']>>
>;

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  findRaw(token: string) {
    return this.prisma.cart.findUnique({
      where: { token },
      include: CART_INCLUDE,
    });
  }

  /** Resolve the caller's cart: by user when logged in, else by cookie token.
   *  Creates one lazily. Returns the cart plus the token the cookie must hold. */
  async resolve(opts: { userId?: string; token?: string }): Promise<CartWithItems> {
    if (opts.userId) {
      const byUser = await this.prisma.cart.findFirst({
        where: { userId: opts.userId },
        include: CART_INCLUDE,
      });
      if (byUser) return byUser;
    }
    if (opts.token) {
      const byToken = await this.findRaw(opts.token);
      // A guest cart claimed by another account stays with that account.
      if (byToken && (!byToken.userId || byToken.userId === opts.userId)) {
        if (opts.userId && !byToken.userId) {
          await this.prisma.cart.update({
            where: { id: byToken.id },
            data: { userId: opts.userId },
          });
        }
        return byToken;
      }
    }
    return this.prisma.cart.create({
      data: {
        token: randomBytes(24).toString('base64url'),
        userId: opts.userId ?? null,
      },
      include: CART_INCLUDE,
    });
  }

  /** On login: fold the guest cookie cart into the user's cart. */
  async mergeGuestIntoUser(guestToken: string | undefined, userId: string): Promise<void> {
    if (!guestToken) return;
    const guest = await this.findRaw(guestToken);
    if (!guest || guest.userId) return;

    const userCart = await this.prisma.cart.findFirst({ where: { userId } });
    if (!userCart) {
      await this.prisma.cart.update({ where: { id: guest.id }, data: { userId } });
      return;
    }
    // Combine quantities line by line, then drop the guest cart.
    for (const item of guest.items) {
      const existing = await this.prisma.cartItem.findUnique({
        where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
      });
      if (existing) {
        await this.prisma.cartItem.update({
          where: { id: existing.id },
          data: {
            quantity: Math.min(existing.quantity + item.quantity, MAX_QTY_PER_LINE),
          },
        });
      } else {
        await this.prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            variantId: item.variantId,
            quantity: item.quantity,
          },
        });
      }
    }
    await this.prisma.cart.delete({ where: { id: guest.id } });
  }

  async addItem(cartId: string, variantId: string, quantity: number) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true },
    });
    if (!variant) throw new NotFoundException('Variant not found.');
    if (variant.stock < 1) throw new BadRequestException('This size is sold out.');

    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId, variantId } },
    });
    const nextQty = Math.min(
      (existing?.quantity ?? 0) + quantity,
      variant.stock,
      MAX_QTY_PER_LINE,
    );
    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: nextQty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: { cartId, variantId, quantity: nextQty },
      });
    }
  }

  async updateQuantity(cartId: string, itemId: string, quantity: number) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId },
      include: { variant: { select: { stock: true } } },
    });
    if (!item) throw new NotFoundException('Cart item not found.');
    if (quantity < 1) {
      await this.prisma.cartItem.delete({ where: { id: item.id } });
      return;
    }
    await this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: Math.min(quantity, item.variant.stock, MAX_QTY_PER_LINE) },
    });
  }

  async removeItem(cartId: string, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({ where: { id: itemId, cartId } });
    if (!item) throw new NotFoundException('Cart item not found.');
    await this.prisma.cartItem.delete({ where: { id: item.id } });
  }

  async applyCoupon(cart: CartWithItems, code: string) {
    const coupon = await this.validateCoupon(code, this.subtotal(cart));
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { couponCode: coupon.code },
    });
  }

  async removeCoupon(cartId: string) {
    await this.prisma.cart.update({
      where: { id: cartId },
      data: { couponCode: null },
    });
  }

  /** Throws with a human message when the coupon can't be used on this cart. */
  async validateCoupon(code: string, subtotal: number): Promise<Coupon> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    const now = new Date();
    if (!coupon || !coupon.isActive) throw new BadRequestException('Invalid coupon code.');
    if (coupon.startsAt && coupon.startsAt > now)
      throw new BadRequestException('This coupon is not live yet.');
    if (coupon.expiresAt && coupon.expiresAt < now)
      throw new BadRequestException('This coupon has expired.');
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit)
      throw new BadRequestException('This coupon has been fully redeemed.');
    if (subtotal < coupon.minCartValue)
      throw new BadRequestException(
        `Add items worth ₹${((coupon.minCartValue - subtotal) / 100).toFixed(0)} more to use ${coupon.code}.`,
      );
    return coupon;
  }

  private subtotal(cart: CartWithItems): number {
    return cart.items.reduce(
      (sum, i) =>
        sum + (i.variant.priceOverride ?? i.variant.product.price) * i.quantity,
      0,
    );
  }

  couponDiscount(coupon: Coupon, subtotal: number): number {
    if (coupon.type === CouponType.PERCENT) {
      // Round to whole rupees so COD totals stay cash-friendly.
      const raw = Math.round((subtotal * coupon.value) / 100 / 100) * 100;
      return coupon.maxDiscount != null ? Math.min(raw, coupon.maxDiscount) : raw;
    }
    return Math.min(coupon.value, subtotal);
  }

  /** Cart + computed money summary, dropping the coupon if it stopped applying. */
  async view(cart: CartWithItems) {
    const items = cart.items.map((i) => {
      const image =
        i.variant.product.images.find((img) => img.color === i.variant.color) ??
        i.variant.product.images[0];
      const unitPrice = i.variant.priceOverride ?? i.variant.product.price;
      return {
        id: i.id,
        variantId: i.variantId,
        name: i.variant.product.name,
        slug: i.variant.product.slug,
        size: i.variant.size,
        color: i.variant.color,
        image: image?.url ?? null,
        unitPrice,
        mrp: i.variant.product.mrp,
        quantity: i.quantity,
        stock: i.variant.stock,
        lineTotal: unitPrice * i.quantity,
      };
    });

    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const mrpTotal = items.reduce((s, i) => s + i.mrp * i.quantity, 0);

    let couponCode: string | null = null;
    let couponDiscount = 0;
    if (cart.couponCode && items.length > 0) {
      try {
        const coupon = await this.validateCoupon(cart.couponCode, subtotal);
        couponCode = coupon.code;
        couponDiscount = this.couponDiscount(coupon, subtotal);
      } catch {
        await this.removeCoupon(cart.id); // silently drop a stale coupon
      }
    }

    const afterDiscount = subtotal - couponDiscount;
    const shippingFee =
      items.length === 0 || afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const total = afterDiscount + shippingFee;
    // Prices are GST-inclusive; surface the contained tax for transparency.
    const taxIncluded = Math.round((afterDiscount * GST_RATE) / (100 + GST_RATE));

    return {
      id: cart.id,
      token: cart.token,
      items,
      summary: {
        itemCount: items.reduce((s, i) => s + i.quantity, 0),
        mrpTotal,
        subtotal,
        mrpSavings: mrpTotal - subtotal,
        couponCode,
        couponDiscount,
        shippingFee,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        amountToFreeShipping: Math.max(0, FREE_SHIPPING_THRESHOLD - afterDiscount),
        taxIncluded,
        total,
        totalSavings: mrpTotal - subtotal + couponDiscount,
      },
    };
  }
}
