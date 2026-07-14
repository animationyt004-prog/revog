import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ReturnsModule } from '../returns/returns.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [JwtModule.register({}), ReturnsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
