import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { TestimonialsController } from './testimonials.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ReviewsController, TestimonialsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
