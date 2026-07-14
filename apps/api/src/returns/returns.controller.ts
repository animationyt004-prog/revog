import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { CurrentUser, JwtAuthGuard, type JwtPayload } from '../auth/jwt-auth.guard';
import { RETURN_REASONS, ReturnsService } from './returns.service';

class CreateReturnDto {
  @IsString()
  orderNumber!: string;

  @IsOptional()
  @IsString()
  orderItemId?: string;

  @IsIn(RETURN_REASONS as unknown as string[])
  reason!: string;
}

@Controller('returns')
@UseGuards(JwtAuthGuard)
export class ReturnsController {
  constructor(private readonly returns: ReturnsService) {}

  @Get('reasons')
  reasons() {
    return RETURN_REASONS;
  }

  @Get()
  mine(@CurrentUser() user: JwtPayload) {
    return this.returns.listForUser(user.sub);
  }

  @Post()
  @HttpCode(201)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateReturnDto) {
    return this.returns.create(user.sub, dto);
  }
}
