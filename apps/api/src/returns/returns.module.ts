import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ReturnsController } from './returns.controller';
import { ReturnsService } from './returns.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ReturnsController],
  providers: [ReturnsService],
  exports: [ReturnsService],
})
export class ReturnsModule {}
