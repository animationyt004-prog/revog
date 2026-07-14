import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { PincodeController } from './pincode.controller';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController, CategoriesController, PincodeController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
