import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
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
