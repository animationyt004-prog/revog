import { Body, Controller, Ip, Post } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';
import { SubscribeService } from './subscribe.service';

class SubscribeDto {
  @IsEmail({}, { message: 'Enter a valid email address.' })
  email!: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\+?91)?[6-9]\d{9}$/, { message: 'Enter a valid Indian mobile number.' })
  phone?: string;
}

@Controller('subscribe')
export class SubscribeController {
  constructor(private readonly subscribe: SubscribeService) {}

  @Post()
  create(@Body() dto: SubscribeDto, @Ip() ip: string) {
    return this.subscribe.subscribe(dto.email, dto.phone, ip);
  }
}
