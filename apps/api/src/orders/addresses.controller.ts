import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';
import { CurrentUser, JwtAuthGuard, type JwtPayload } from '../auth/jwt-auth.guard';
import { PrismaService } from '../common/prisma/prisma.service';

export class AddressDto {
  @IsString()
  @Length(2, 80)
  fullName!: string;

  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit mobile number.' })
  phone!: string;

  @IsString()
  @Length(3, 120)
  line1!: string;

  @IsOptional()
  @IsString()
  @Length(0, 120)
  line2?: string;

  @IsString()
  @Length(2, 60)
  city!: string;

  @IsString()
  @Length(2, 60)
  state!: string;

  @Matches(/^\d{6}$/, { message: 'Pincode must be 6 digits.' })
  pincode!: string;

  @IsOptional()
  @IsIn(['HOME', 'WORK', 'OTHER'])
  type?: 'HOME' | 'WORK' | 'OTHER';

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.prisma.address.findMany({
      where: { userId: user.sub },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() dto: AddressDto) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId: user.sub },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.create({
      data: { ...dto, userId: user.sub },
    });
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AddressDto,
  ) {
    const existing = await this.prisma.address.findFirst({
      where: { id, userId: user.sub },
    });
    if (!existing) throw new NotFoundException('Address not found.');
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId: user.sub, id: { not: id } },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.update({ where: { id }, data: dto });
  }

  @Delete(':id')
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const existing = await this.prisma.address.findFirst({
      where: { id, userId: user.sub },
    });
    if (!existing) throw new NotFoundException('Address not found.');
    await this.prisma.address.delete({ where: { id } });
    return { ok: true };
  }
}
