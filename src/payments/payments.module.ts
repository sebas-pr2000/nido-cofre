import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { RealtimeModule } from '../realtime/realtime.module.js';

@Module({
  imports: [RealtimeModule],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}