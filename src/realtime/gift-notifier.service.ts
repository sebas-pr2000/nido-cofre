import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  giftInclude,
  toViewerGift,
  VISIBLE_TO_RECEIVER,
} from '../gifts/gift-view.js';
import { GIFT_EVENT, GiftEventType } from './gift-events.js';
import { RealtimeGateway } from './realtime.gateway.js';

@Injectable()
export class GiftNotifier {
  private readonly logger = new Logger(GiftNotifier.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: RealtimeGateway,
  ) {}

  async notify(giftId: string, type: GiftEventType) {
    try {
      const gift = await this.prisma.gift.findUnique({
        where: { id: giftId },
        include: giftInclude,
      });
      if (!gift) return;

      this.gateway.emitToUser(gift.senderId, GIFT_EVENT, {
        type,
        gift: toViewerGift(gift, gift.senderId),
      });

      if (VISIBLE_TO_RECEIVER.includes(gift.status)) {
        this.gateway.emitToUser(gift.receiverId, GIFT_EVENT, {
          type,
          gift: toViewerGift(gift, gift.receiverId),
        });
      }
    } catch (e) {
      this.logger.error(`No se pudo notificar ${type} del cofre ${giftId}`, e as Error);
    }
  }
}