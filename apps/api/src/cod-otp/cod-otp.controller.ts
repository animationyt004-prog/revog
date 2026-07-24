import { Body, Controller, Get, Ip, Post } from '@nestjs/common';
import { IsString, Length, Matches } from 'class-validator';
import { CodOtpService } from './cod-otp.service';

class SendOtpDto {
  @IsString()
  @Matches(/^(\+?91)?[6-9]\d{9}$/, { message: 'Enter a valid Indian mobile number.' })
  phone!: string;
}

class VerifyOtpDto {
  @IsString()
  @Matches(/^(\+?91)?[6-9]\d{9}$/, { message: 'Enter a valid Indian mobile number.' })
  phone!: string;

  @IsString()
  @Length(4, 8)
  code!: string;
}

@Controller('cod-otp')
export class CodOtpController {
  constructor(private readonly codOtp: CodOtpService) {}

  /** Whether checkout should require COD phone verification. */
  @Get('status')
  status() {
    return { enabled: this.codOtp.enabled };
  }

  @Post('send')
  send(@Body() dto: SendOtpDto, @Ip() ip: string) {
    return this.codOtp.send(dto.phone, ip);
  }

  @Post('verify')
  verify(@Body() dto: VerifyOtpDto) {
    return this.codOtp.verify(dto.phone, dto.code);
  }
}
