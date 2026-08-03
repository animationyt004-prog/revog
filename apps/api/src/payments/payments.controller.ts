import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentsService } from './payments.service';

class VerifyPaymentDto {
  @IsString()
  orderNumber!: string;

  @IsString()
  razorpayOrderId!: string;

  @IsString()
  razorpayPaymentId!: string;

  @IsString()
  @Length(10, 256)
  razorpaySignature!: string;
}

class PaymentFailedDto {
  @IsString()
  orderNumber!: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

class MagicAddressDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  zipcode?: string;

  @IsOptional()
  @IsString()
  state_code?: string;

  @IsOptional()
  @IsString()
  country?: string;
}

/** Razorpay's shipping-info payload. Every field it sends is declared, even
 *  the ones the handler ignores: the global pipe strips unknown properties,
 *  and an undeclared field would be dropped before it could be read. */
class MagicShippingInfoDto {
  @IsString()
  razorpay_order_id!: string;

  @IsOptional()
  @IsString()
  order_id?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MagicAddressDto)
  addresses?: MagicAddressDto[];
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /** Called by the frontend with the modal's success payload. The HMAC
   *  signature is the proof of payment — no auth needed beyond it. */
  @Post('verify')
  @HttpCode(200)
  verify(@Body() dto: VerifyPaymentDto) {
    return this.payments.verify(dto);
  }

  /**
   * Razorpay's server-to-server callback. Deliberately takes the raw request
   * rather than a DTO: the signature covers the exact bytes Razorpay sent, and
   * the global ValidationPipe would reject their payload's fields anyway.
   *
   * Always answers 200 on a handled event so Razorpay stops retrying.
   */
  @Post('webhook')
  @HttpCode(200)
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature?: string,
  ) {
    return this.payments.handleWebhook(
      req.rawBody ?? Buffer.alloc(0),
      signature,
    );
  }

  @Post('failed')
  @HttpCode(200)
  failed(@Body() dto: PaymentFailedDto) {
    return this.payments.recordFailure(dto.orderNumber, dto.reason, dto.email);
  }

  /**
   * Magic Checkout's serviceability lookup, configured as the "URL for
   * shipping info" in the Razorpay dashboard.
   *
   * Razorpay documents this endpoint as GET but sends the addresses as a JSON
   * body, which express parses either way; both verbs are bound so a change of
   * mind on their side does not take the checkout down. It must stay public —
   * Razorpay's servers cannot authenticate, and the handler is written to have
   * nothing worth stealing.
   */
  @Get('magic/shipping-info')
  @HttpCode(200)
  magicShippingInfoGet(@Body() dto: MagicShippingInfoDto) {
    return this.magicShippingInfo(dto);
  }

  @Post('magic/shipping-info')
  @HttpCode(200)
  magicShippingInfoPost(@Body() dto: MagicShippingInfoDto) {
    return this.magicShippingInfo(dto);
  }

  private magicShippingInfo(dto: MagicShippingInfoDto) {
    return this.payments.magicShippingInfo({
      razorpayOrderId: dto.razorpay_order_id,
      addresses: dto.addresses ?? [],
    });
  }

  /** Retry a pending order's payment (guest access gated by email match). */
  @Get('session/:orderNumber')
  session(
    @Param('orderNumber') orderNumber: string,
    @Query('email') email = '',
  ) {
    return this.payments.session(orderNumber, email);
  }
}
