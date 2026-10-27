import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GiftStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateGiftDto } from './dto/create-gift.dto.js';

const GIFT_EXPIRATION_DAYS = 7;

export const giftInclude = {
  sender: true,
  receiver: true,
  chosenProduct: true,
  options: {
    include: { product: true },
    orderBy: { position: 'asc' },
  },
  payments: { orderBy: { createdAt: 'desc' } },
} satisfies Prisma.GiftInclude;

export type GiftWithRelations = Prisma.GiftGetPayload<{
  include: typeof giftInclude;
}>;

// ? Estados en los que Laura puede ver que tiene un cofre
const VISIBLE_TO_RECEIVER: GiftStatus[] = [
  GiftStatus.SENT,
  GiftStatus.OPENED,
  GiftStatus.CHOSEN,
  GiftStatus.EXPIRED,
];

@Injectable()
export class GiftsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.forViewer(gift, viewerId);
  }

  findSent(userId: string) {
    return this.prisma.gift.findMany({
      where: { senderId: userId },
      include: giftInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findReceived(userId: string) {
    const gifts = await this.prisma.gift.findMany({
      where: { receiverId: userId, status: { in: VISIBLE_TO_RECEIVER } },
      include: giftInclude,
      orderBy: { createdAt: 'desc' },
    });
    return gifts.map((g) => this.forViewer(g, userId));
  }

  // ? Lo que ve cada persona del mismo cofre
  private forViewer(gift: GiftWithRelations, viewerId: string) {
    if (gift.senderId === viewerId) {
      return gift;
    }

    // ? Quien recibe: no ve presupuesto ni pagos,
    // ? y no ve las opciones hasta abrir el cofre
    const { budget: _budget, payments: _payments, ...rest } = gift;
    return {
      ...rest,
      options: gift.status === GiftStatus.SENT ? [] : gift.options,
    };
  }
}