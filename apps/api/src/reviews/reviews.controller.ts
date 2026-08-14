import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  Min,
} from 'class-validator';
import {
  CurrentUser,
  JwtAuthGuard,
  type JwtPayload,
} from '../auth/jwt-auth.guard';
import { ReviewsService } from './reviews.service';

class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @Length(0, 120)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  body?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  photoUrl?: string;
}

@Controller('products/:slug/reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  list(@Param('slug') slug: string) {
    return this.reviews.list(slug);
  }

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  create(
    @Param('slug') slug: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviews.upsert(slug, user.sub, dto);
  }

  @Post('photo')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadPhoto(
    @Param('slug') slug: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFile()
    file:
      | { buffer: Buffer; mimetype: string; size: number; originalname: string }
      | undefined,
  ) {
    if (!file) throw new BadRequestException('Choose a photo to upload.');
    return this.reviews.uploadPhoto(slug, user.sub, file);
  }
}
