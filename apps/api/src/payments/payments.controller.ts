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
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';
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
    return this.payments.handleWebhook(req.rawBody ?? Buffer.alloc(0), signature);
  }

  @Post('failed')
  @HttpCode(200)
  failed(@Body() dto: PaymentFailedDto) {
    return this.payments.recordFailure(dto.orderNumber, dto.reason, dto.email);
  }

  /** Retry a pending order's payment (guest access gated by email match). */
  @Get('session/:orderNumber')
  session(@Param('orderNumber') orderNumber: string, @Query('email') email = '') {
    return this.payments.session(orderNumber, email);
  }
}
