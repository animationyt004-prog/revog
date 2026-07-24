import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CodOtpController } from './cod-otp.controller';
import { CodOtpService } from './cod-otp.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [CodOtpController],
  providers: [CodOtpService],
  exports: [CodOtpService],
})
export class CodOtpModule {}
