import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CartModule } from '../cart/cart.module';
import { CodOtpModule } from '../cod-otp/cod-otp.module';
import { PaymentsModule } from '../payments/payments.module';
import { AddressesController } from './addresses.controller';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [JwtModule.register({}), CartModule, PaymentsModule, CodOtpModule],
  controllers: [OrdersController, AddressesController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
