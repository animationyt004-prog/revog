import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('pincode')
export class PincodeController {
  constructor(private readonly products: ProductsService) {}

  @Get(':code')
  check(@Param('code') code: string) {
    if (!/^\d{6}$/.test(code)) {
      throw new BadRequestException('Pincode must be 6 digits.');
    }
    return this.products.checkPincode(code);
  }
}
