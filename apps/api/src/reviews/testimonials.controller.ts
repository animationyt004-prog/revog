import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

/**
 * Catalogue-wide reviews for the storefront's testimonial rail. Separate from
 * ReviewsController because that one is mounted under a product slug; this
 * reads across every product.
 */
@Controller('reviews')
export class TestimonialsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('recent')
  recent(@Query('take', new DefaultValuePipe(6), ParseIntPipe) take: number) {
    return this.reviews.recent(take);
  }
}
