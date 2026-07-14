import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  // JwtModule registered directly (not via AuthModule) to avoid a circular
  // dependency — AuthModule imports CartModule for login-time cart merging.
  imports: [JwtModule.register({})],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
