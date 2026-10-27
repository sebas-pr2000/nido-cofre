import {
  BadRequestException,
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GiftStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateGiftDto } from './dto/create-gift.dto.js';
import { GiftNotifier } from '../realtime/gift-notifier.service.js';
import {
  giftInclude,
  toViewerGift,
  VISIBLE_TO_RECEIVER,
} from './gift-view.js';
import { ActorDto, ChooseOptionDto, ThankDto } from './dto/receiver-actions.dto.js';

const GIFT_EXPIRATION_DAYS = 7;

@Injectable()
export class GiftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: GiftNotifier,
  ) {}

  // * Quien regala
  async create(dto: CreateGiftDto) {
    if (dto.senderId === dto.receiverId) {
      throw new BadRequestException('No puedes enviarte un cofre a ti mismo');
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: [dto.senderId, dto.receiverId] } },
    });
    if (users.length !== 2) {
      throw new NotFoundException('Quien envía o quien recibe no existe');
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.productIds } },
    });
    if (products.length !== dto.productIds.length) {
      throw new NotFoundException('Uno o más productos no existen');
    }

    const overBudget = products.filter((p) => p.price > dto.budget);
    if (overBudget.length > 0) {
      throw new BadRequestException(
        `Superan el presupuesto: ${overBudget.map((p) => p.title).join(', ')}`,
      );
    }

    const outOfStock = products.filter((p) => p.stock <= 0);
    if (outOfStock.length > 0) {
      throw new BadRequestException(
        `Sin stock: ${outOfStock.map((p) => p.title).join(', ')}`,
      );
    }

    const expiresAt = new Date(
      Date.now() + GIFT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
    );

    return this.prisma.gift.create({
      data: {
        senderId: dto.senderId,
        receiverId: dto.receiverId,
        budget: dto.budget,
        message: dto.message.trim(),
        expiresAt,
        options: {
          create: dto.productIds.map((productId, position) => ({
            productId,
            position,
          })),
        },
      },
      include: giftInclude,
    });
  }

  findSent(userId: string) {
    return this.prisma.gift.findMany({
      where: { senderId: userId },
      include: giftInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  // * Quien recibe
  async findReceived(userId: string) {
    const gifts = await this.prisma.gift.findMany({
      where: { receiverId: userId, status: { in: VISIBLE_TO_RECEIVER } },
      include: giftInclude,
      orderBy: { createdAt: 'desc' },
    });
    return gifts.map((g) => toViewerGift(g, userId));
  }

  async open(giftId: string, dto: ActorDto) {
    const gift = await this.findForReceiver(giftId, dto.userId);

    if (gift.status !== GiftStatus.SENT) {
      throw new ConflictException('Este cofre ya fue abierto');
    }
    if (gift.expiresAt < new Date()) {
      throw new GoneException('Este cofre expiró');
    }

    const { count } = await this.prisma.gift.updateMany({
      where: { id: giftId, status: GiftStatus.SENT },
      data: { status: GiftStatus.OPENED, openedAt: new Date() },
    });
    if (count === 0) {
      throw new ConflictException('Este cofre ya fue abierto');
    }

    await this.notifier.notify(giftId, 'gift_opened');
    return this.findOne(giftId, dto.userId);
  }

  async choose(giftId: string, dto: ChooseOptionDto) {
    const gift = await this.findForReceiver(giftId, dto.userId);

    if (gift.status !== GiftStatus.OPENED) {
      throw new ConflictException('Primero abre el cofre, o ya elegiste tu regalo');
    }

    const option = gift.options.find((o) => o.productId === dto.productId);
    if (!option) {
      throw new BadRequestException('Ese producto no está en tu cofre');
    }

    const credit = Math.max(0, gift.budget - option.product.price);

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.gift.updateMany({
        where: { id: giftId, status: GiftStatus.OPENED },
        data: {
          status: GiftStatus.CHOSEN,
          chosenProductId: dto.productId,
          creditGenerated: credit,
          chosenAt: new Date(),
        },
      });
      if (updated.count === 0) {
        throw new ConflictException('Ya elegiste un regalo de este cofre');
      }

      const stock = await tx.product.updateMany({
        where: { id: dto.productId, stock: { gt: 0 } },
        data: { stock: { decrement: 1 } },
      });
      if (stock.count === 0) {
        throw new ConflictException('Ese producto se acaba de agotar, elige otra opción');
      }

      await tx.user.update({
        where: { id: dto.userId },
        data: { creditBalance: { increment: credit } },
      });
    });

    await this.notifier.notify(giftId, 'gift_chosen');
    return this.findOne(giftId, dto.userId);
  }

  async thank(giftId: string, dto: ThankDto) {
    const gift = await this.findForReceiver(giftId, dto.userId);

    if (gift.status !== GiftStatus.CHOSEN) {
      throw new ConflictException('Primero elige tu regalo');
    }

    const { count } = await this.prisma.gift.updateMany({
      where: { id: giftId, thankYouMessage: null },
      data: { thankYouMessage: dto.message.trim() },
    });
    if (count === 0) {
      throw new ConflictException('Ya enviaste tu agradecimiento');
    }

    await this.notifier.notify(giftId, 'gift_thanked');
    return this.findOne(giftId, dto.userId);
  }

  // * Compartido 

  async findOne(id: string, viewerId: string) {
    const gift = await this.prisma.gift.findUnique({
      where: { id },
      include: giftInclude,
    });

    const isSender = gift?.senderId === viewerId;
    const isReceiver =
      gift?.receiverId === viewerId &&
      VISIBLE_TO_RECEIVER.includes(gift.status);

    if (!gift || (!isSender && !isReceiver)) {
      throw new NotFoundException('Cofre no encontrado');
    }

    return toViewerGift(gift, viewerId);
  }

  private async findForReceiver(giftId: string, userId: string) {
    const gift = await this.prisma.gift.findUnique({
      where: { id: giftId },
      include: giftInclude,
    });
    if (
      !gift ||
      gift.receiverId !== userId ||
      !VISIBLE_TO_RECEIVER.includes(gift.status)
    ) {
      throw new NotFoundException('Cofre no encontrado');
    }
    return gift;
  } 
}