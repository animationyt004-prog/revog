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
import { Badge, Fit, OrderStatus, ProductStatus, ReturnStatus, Size } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsHexColor,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { ReturnsService } from '../returns/returns.service';
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

class ColorDto {
  @IsString()
  @Length(2, 40)
  name!: string;

  @IsHexColor()
  hex!: string;
}

class CreateProductDto {
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsString()
  categorySlug!: string;

  @IsInt()
  @Min(100)
  price!: number; // paise (cost + markup, editable)

  @IsInt()
  @Min(100)
  mrp!: number; // paise (for the strike-through)

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsEnum(Fit)
  fit!: Fit;

  @IsOptional()
  @IsString()
  @Length(0, 120)
  fabric?: string;

  @IsUrl({ require_protocol: true })
  imageUrl!: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ColorDto)
  colors!: ColorDto[];

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Size, { each: true })
  sizes!: Size[];

  @IsInt()
  @Min(0)
  @Max(100000)
  stock!: number;

  @IsOptional()
  @IsArray()
  @IsEnum(Badge, { each: true })
  badges?: Badge[];

  @IsBoolean()
  publish!: boolean;
}

class ResolveReturnDto {
  @IsEnum(ReturnStatus)
  status!: ReturnStatus;
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
  constructor(
    private readonly admin: AdminService,
    private readonly returns: ReturnsService,
  ) {}

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

  @Post('products')
  @HttpCode(201)
  createProduct(@Body() dto: CreateProductDto) {
    return this.admin.createProduct({
      ...dto,
      description: dto.description,
      fabric: dto.fabric,
      badges: dto.badges ?? [],
    });
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

  // Returns
  @Get('returns')
  listReturns() {
    return this.returns.listAll();
  }

  @Patch('returns/:id')
  resolveReturn(@Param('id') id: string, @Body() dto: ResolveReturnDto) {
    return this.returns.resolve(id, dto.status);
  }
}
