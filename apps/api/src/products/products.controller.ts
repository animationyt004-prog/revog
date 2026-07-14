import { Controller, Get, Param, Query } from '@nestjs/common';
import { Fit, Size } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ProductsService } from './products.service';
import type { Collection, SortKey } from './products.service';

/** "S,M,XL" -> ["S","M","XL"] for list-ish query params. */
const csv = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? value.split(',').map((s) => s.trim()).filter(Boolean)
      : value,
  );

class ListProductsQuery {
  @IsOptional()
  @IsIn(['new', 'trending', 'limited', 'bestsellers'])
  collection?: Collection;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @csv()
  @IsArray()
  @IsEnum(Size, { each: true })
  sizes?: Size[];

  @IsOptional()
  @csv()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

  @IsOptional()
  @csv()
  @IsArray()
  @IsEnum(Fit, { each: true })
  fits?: Fit[];

  @IsOptional()
  @csv()
  @IsArray()
  @IsString({ each: true })
  fabrics?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsIn(['newest', 'popular', 'price_asc', 'price_desc', 'discount', 'rating'])
  sort?: SortKey;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(48)
  take?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;
}

class FacetsQuery {
  @IsOptional()
  @IsIn(['new', 'trending', 'limited', 'bestsellers'])
  collection?: Collection;

  @IsOptional()
  @IsString()
  category?: string;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query() query: ListProductsQuery) {
    return this.products.findAll(query);
  }

  @Get('facets')
  facets(@Query() query: FacetsQuery) {
    return this.products.facets(query);
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.products.findBySlug(slug);
  }

  @Get(':slug/related')
  related(@Param('slug') slug: string) {
    return this.products.related(slug);
  }
}
