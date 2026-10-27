import { Module } from '@nestjs/common';
import { GiftsController } from './gifts.controller.js';
import { GiftsService } from './gifts.service.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';

@Module({
  imports: [PaymentsModule, RealtimeModule],
  controllers: [GiftsController],
  providers: [GiftsService],
})
export class GiftsModule {}