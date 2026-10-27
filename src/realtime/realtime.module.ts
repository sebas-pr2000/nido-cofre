import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway.js';
import { GiftNotifier } from './gift-notifier.service.js';

@Module({
  providers: [RealtimeGateway, GiftNotifier],
  exports: [GiftNotifier],
})
export class RealtimeModule {}