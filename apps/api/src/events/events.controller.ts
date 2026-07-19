import { Body, Controller, Get, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
import { AnalyticsEventType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { EventsService } from './events.service';

class RecordEventDto {
  @IsEnum(AnalyticsEventType)
  type!: AnalyticsEventType;

  @IsString()
  @Length(1, 64)
  sessionId!: string;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  path?: string;

  @IsOptional()
  @IsString()
  @Length(0, 64)
  productId?: string;
}

@Controller()
export class EventsController {
  constructor(private readonly events: EventsService) {}

  /** Public: storefront records a funnel event. Never fails the caller. */
  @Post('events')
  @HttpCode(204)
  async record(@Body() dto: RecordEventDto): Promise<void> {
    await this.events.record(dto).catch(() => undefined);
  }

  /** Admin: aggregated funnel for the Traffic dashboard. */
  @Get('admin/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  analytics(@Query('days') days = '7') {
    return this.events.funnel(Number(days));
  }
}
