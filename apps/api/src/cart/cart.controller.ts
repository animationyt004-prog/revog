import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import type { Request, Response } from 'express';
import type { JwtPayload } from '../auth/jwt-auth.guard';
import { CartService } from './cart.service';

export const CART_COOKIE = 'rv_cart';

class AddItemDto {
  @IsString()
  variantId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  quantity?: number;
}

class UpdateQtyDto {
  @IsInt()
  @Min(0)
  @Max(10)
  quantity!: number;
}

class CouponDto {
  @IsString()
  @Length(3, 32)
  code!: string;
}

@Controller('cart')
export class CartController {
  private readonly isProd: boolean;

  constructor(
    private readonly cart: CartService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.isProd = config.get('NODE_ENV') === 'production';
  }

  /** Cart endpoints serve guests and users alike: auth is optional. */
  private async identity(req: Request): Promise<{ userId?: string; token?: string }> {
    const token = (req.cookies as Record<string, string> | undefined)?.[CART_COOKIE];
    const header = req.headers.authorization;
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (bearer) {
      try {
        const payload = await this.jwt.verifyAsync<JwtPayload>(bearer, {
          secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
        });
        return { userId: payload.sub, token };
      } catch {
        // expired/invalid access token — treat as guest rather than failing
      }
    }
    return { token };
  }

  private setCartCookie(res: Response, token: string) {
    res.cookie(CART_COOKIE, token, {
      httpOnly: true,
      secure: this.isProd,
      // Cross-domain storefront/API in prod needs SameSite=None (+Secure).
      sameSite: this.isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 30 * 86_400_000,
    });
  }

  private async loadCart(req: Request, res: Response) {
    const identity = await this.identity(req);
    const cart = await this.cart.resolve(identity);
    if (cart.token !== identity.token) this.setCartCookie(res, cart.token);
    return cart;
  }

  @Get()
  async get(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cart = await this.loadCart(req, res);
    return this.cart.view(cart);
  }

  @Post('items')
  @HttpCode(200)
  async add(
    @Body() dto: AddItemDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cart = await this.loadCart(req, res);
    await this.cart.addItem(cart.id, dto.variantId, dto.quantity ?? 1);
    return this.cart.view((await this.cart.findRaw(cart.token))!);
  }

  @Patch('items/:itemId')
  async update(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateQtyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cart = await this.loadCart(req, res);
    await this.cart.updateQuantity(cart.id, itemId, dto.quantity);
    return this.cart.view((await this.cart.findRaw(cart.token))!);
  }

  @Delete('items/:itemId')
  async remove(
    @Param('itemId') itemId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cart = await this.loadCart(req, res);
    await this.cart.removeItem(cart.id, itemId);
    return this.cart.view((await this.cart.findRaw(cart.token))!);
  }

  @Post('coupon')
  @HttpCode(200)
  async applyCoupon(
    @Body() dto: CouponDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cart = await this.loadCart(req, res);
    await this.cart.applyCoupon(cart, dto.code);
    return this.cart.view((await this.cart.findRaw(cart.token))!);
  }

  @Delete('coupon')
  async removeCoupon(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cart = await this.loadCart(req, res);
    await this.cart.removeCoupon(cart.id);
    return this.cart.view((await this.cart.findRaw(cart.token))!);
  }
}
