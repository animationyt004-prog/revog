import { Controller, Get, Param, Query } from '@nestjs/common';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ProductsService } from './products.service';
import type { Collection } from './products.service';

class ListProductsQuery {
  @IsOptional()
  @IsIn(['new', 'trending', 'limited', 'bestsellers'])
  collection?: Collection;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(48)
  take?: number;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query() query: ListProductsQuery) {
    return this.products.findAll(query);
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.products.findBySlug(slug);
  }
}
