import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import type { Request } from 'express';
import {
  CurrentUser,
  JwtAuthGuard,
  type JwtPayload,
} from '../auth/jwt-auth.guard';
import { CART_COOKIE } from '../cart/cart.controller';
import { clientIp } from '../common/client-ip';
import { PrismaService } from '../common/prisma/prisma.service';
import { CodOtpService } from '../cod-otp/cod-otp.service';
import { AddressDto } from './addresses.controller';
import { OrdersService } from './orders.service';

class CheckoutDto {
  @IsIn(['COD', 'RAZORPAY'])
  paymentMethod!: 'COD' | 'RAZORPAY';

  /** Required for guests; ignored for logged-in users. */
  @IsOptional()
  @IsEmail()
  email?: string;

  /** Logged-in users may reference a saved address instead. */
  @IsOptional()
  @IsString()
  addressId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  /** Short-lived token proving the buyer's phone was OTP-verified (COD). */
  @IsOptional()
  @IsString()
  codVerifyToken?: string;

  /* Meta attribution, read off the buyer's own cookies while they are still
   * here. The Purchase that matters is sent from the server later — after a
   * Razorpay webhook, with no browser attached — so if these are not captured
   * now, Meta has nothing to tie that sale to an ad click. */

  @IsOptional()
  @IsString()
  @Length(0, 128)
  metaFbp?: string;

  /** `fb.1.<ts>.<fbclid>`, and an fbclid can run to several hundred chars. */
  @IsOptional()
  @IsString()
  @Length(0, 600)
  metaFbc?: string;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  metaSourceUrl?: string;
}

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly codOtp: CodOtpService,
  ) {}

  private async optionalUser(req: Request): Promise<JwtPayload | null> {
    const header = req.headers.authorization;
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!bearer) return null;
    try {
      return await this.jwt.verifyAsync<JwtPayload>(bearer, {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      });
    } catch {
      return null;
    }
  }

  @Post('checkout')
  @HttpCode(201)
  async checkout(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: CheckoutDto,
    @Req() req: Request,
  ) {
    const user = await this.optionalUser(req);
    const cartToken = (req.cookies as Record<string, string> | undefined)?.[
      CART_COOKIE
    ];
    if (!cartToken) throw new BadRequestException('Your cart is empty.');

    const email = user?.email ?? dto.email;
    if (!email)
      throw new BadRequestException('Email is required for guest checkout.');

    let address = dto.address;
    if (!address && user && dto.addressId) {
      const saved = await this.prisma.address.findFirst({
        where: { id: dto.addressId, userId: user.sub },
      });
      if (!saved) throw new BadRequestException('Saved address not found.');
      address = {
        fullName: saved.fullName,
        phone: saved.phone,
        line1: saved.line1,
        line2: saved.line2 ?? undefined,
        city: saved.city,
        state: saved.state,
        pincode: saved.pincode,
      };
    }
    if (!address)
      throw new BadRequestException('Shipping address is required.');

    // When SMS verification is enabled, COD orders must carry a valid,
    // phone-matched OTP token — this is what cuts fake/RTO-prone COD orders.
    if (dto.paymentMethod === 'COD' && this.codOtp.enabled) {
      const verified = await this.codOtp.isPhoneVerified(
        dto.codVerifyToken,
        address.phone,
      );
      if (!verified) {
        throw new BadRequestException(
          'Please verify your mobile number to place a COD order.',
        );
      }
    }

    const order = await this.orders.checkout({
      cartToken,
      userId: user?.sub,
      email,
      address,
      paymentMethod: dto.paymentMethod,
      meta: {
        fbp: dto.metaFbp,
        fbc: dto.metaFbc,
        sourceUrl: dto.metaSourceUrl,
        // Taken from this request, not from the later webhook: the webhook
        // comes from Razorpay's servers, so its IP and user agent describe
        // Razorpay rather than the buyer.
        ip: clientIp(req),
        userAgent: req.headers['user-agent'],
      },
    });
    return order;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser() user: JwtPayload) {
    return this.orders.listForUser(user.sub);
  }

  @Get(':orderNumber')
  async detail(
    @Param('orderNumber') orderNumber: string,
    @Query('email') email: string | undefined,
    @Query('t') token: string | undefined,
    @Req() req: Request,
  ) {
    const user = await this.optionalUser(req);
    return this.orders.findByNumber(orderNumber, {
      userId: user?.sub,
      email,
      token,
    });
  }
}
