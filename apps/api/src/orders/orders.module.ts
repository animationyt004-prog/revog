import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CartModule } from '../cart/cart.module';
import { AddressesController } from './addresses.controller';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [JwtModule.register({}), CartModule],
  controllers: [OrdersController, AddressesController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
