import { Module } from '@nestjs/common';
import { GiftsController } from './gifts.controller.js';
import { GiftsService } from './gifts.service.js';
import { PaymentsModule } from '../payments/payments.module.js';

@Module({
  imports: [PaymentsModule],
  controllers: [GiftsController],
  providers: [GiftsService],
})
export class GiftsModule {}