import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { MailerModule } from './common/mailer/mailer.module';
import { SmsModule } from './common/sms/sms.module';
import { StorageModule } from './common/storage/storage.module';
import { RedisModule } from './common/redis/redis.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { CodOtpModule } from './cod-otp/cod-otp.module';
import { EventsModule } from './events/events.module';
import { HealthModule } from './health/health.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ProductsModule } from './products/products.module';
import { ReturnsModule } from './returns/returns.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SubscribeModule } from './subscribe/subscribe.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    MailerModule,
    SmsModule,
    StorageModule,
    AdminModule,
    AuthModule,
    CartModule,
    CodOtpModule,
    EventsModule,
    OrdersModule,
    PaymentsModule,
    HealthModule,
    ProductsModule,
    ReturnsModule,
    ReviewsModule,
    SubscribeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
