import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderStatus, ProductStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';

class ListOrdersQuery {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;
}

class AdvanceOrderDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  note?: string;
}

class UpdateProductDto {
  @IsOptional()
  @IsInt()
  @Min(100)
  price?: number; // paise

  @IsOptional()
  @IsInt()
  @Min(100)
  mrp?: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional() @IsBoolean() isNewArrival?: boolean;
  @IsOptional() @IsBoolean() isTrending?: boolean;
  @IsOptional() @IsBoolean() isLimited?: boolean;
  @IsOptional() @IsBoolean() isBestSeller?: boolean;
}

class UpdateStockDto {
  @IsInt()
  @Min(0)
  @Max(100000)
  stock!: number;
}

class CreateCouponDto {
  @IsString()
  @Length(3, 24)
  code!: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  description?: string;

  @IsIn(['PERCENT', 'FLAT'])
  type!: 'PERCENT' | 'FLAT';

  @IsInt()
  @Min(1)
  value!: number; // percent (1-90) or paise for FLAT

  @IsOptional() @IsInt() @Min(0) minCartValue?: number;
  @IsOptional() @IsInt() @Min(100) maxDiscount?: number;
  @IsOptional() @IsInt() @Min(1) usageLimit?: number;
  @IsOptional() @IsInt() @Min(1) perUserLimit?: number;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.admin.dashboard();
  }

  // Orders
  @Get('orders')
  orders(@Query() q: ListOrdersQuery) {
    return this.admin.listOrders(q);
  }

  @Get('orders/:orderNumber')
  order(@Param('orderNumber') orderNumber: string) {
    return this.admin.orderDetail(orderNumber);
  }

  @Patch('orders/:orderNumber/status')
  advance(@Param('orderNumber') orderNumber: string, @Body() dto: AdvanceOrderDto) {
    return this.admin.advanceOrder(orderNumber, dto.status, dto.note);
  }

  // Products
  @Get('products')
  products() {
    return this.admin.listProducts();
  }

  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.admin.updateProduct(id, dto);
  }

  @Patch('variants/:id/stock')
  updateStock(@Param('id') id: string, @Body() dto: UpdateStockDto) {
    return this.admin.updateVariantStock(id, dto.stock);
  }

  // Coupons
  @Get('coupons')
  coupons() {
    return this.admin.listCoupons();
  }

  @Post('coupons')
  @HttpCode(201)
  createCoupon(@Body() dto: CreateCouponDto) {
    return this.admin.createCoupon(dto);
  }

  @Patch('coupons/:id/toggle')
  toggleCoupon(@Param('id') id: string) {
    return this.admin.toggleCoupon(id);
  }

  // Customers
  @Get('customers')
  customers() {
    return this.admin.listCustomers();
  }
}
