import { GiftStatus, Prisma } from '@prisma/client';


// ? usando satisfies, para verificar que el objeto cumpla con el tipo GiftInclude
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
export const VISIBLE_TO_RECEIVER: GiftStatus[] = [
  GiftStatus.SENT,
  GiftStatus.OPENED,
  GiftStatus.CHOSEN,
  GiftStatus.EXPIRED,
];

// Lo que ve cada persona del mismo cofre
export function toViewerGift(gift: GiftWithRelations, viewerId: string) {
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