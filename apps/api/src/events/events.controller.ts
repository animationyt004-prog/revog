import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AnalyticsEventType } from '@prisma/client';
import type { Request } from 'express';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { clientIp } from '../common/client-ip';
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

  /** Catalog id (variant SKU) — what Meta matches against the product feed.
   *  Kept separate from productId, which addresses our own analytics rows. */
  @IsOptional()
  @IsString()
  @Length(0, 64)
  contentId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contentIds?: string[];

  @IsOptional()
  @IsString()
  @Length(0, 200)
  contentName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  /** ADD_PAYMENT_INFO only: which tender the shopper picked. */
  @IsOptional()
  @IsIn(['online', 'cod'])
  paymentMethod?: 'online' | 'cod';

  @IsOptional()
  @IsString()
  @Length(0, 128)
  eventId?: string;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  @Length(0, 128)
  fbp?: string;

  /** `fb.1.<ts>.<fbclid>`, and an fbclid can run to several hundred chars —
   *  a tighter cap here would 400 the request and lose the whole event. */
  @IsOptional()
  @IsString()
  @Length(0, 600)
  fbc?: string;
}

@Controller()
export class EventsController {
  constructor(private readonly events: EventsService) {}

  /** Public: storefront records a funnel event. Never fails the caller. */
  @Post('events')
  @HttpCode(204)
  async record(
    @Body() dto: RecordEventDto,
    @Req() req: Request,
  ): Promise<void> {
    await this.events
      .record({
        ...dto,
        ip: clientIp(req),
        userAgent: req.headers['user-agent'],
      })
      // Analytics must never surface as a checkout-blocking error.
      .catch(() => undefined);
  }

  /** Admin: aggregated funnel for the Traffic dashboard. */
  @Get('admin/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  analytics(@Query('days') days = '7') {
    return this.events.funnel(Number(days));
  }
}
