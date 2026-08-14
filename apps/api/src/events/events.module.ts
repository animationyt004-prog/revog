import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { MetaConversionsService } from './meta-conversions.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [EventsController],
  providers: [EventsService, MetaConversionsService],
  exports: [MetaConversionsService],
})
export class EventsModule {}
