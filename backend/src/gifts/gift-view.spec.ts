import { GiftStatus, PaymentStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { toViewerGift, type GiftWithRelations } from './gift-view.js';

const sender = { id: 'andres', name: 'Andrés', avatarUrl: '', creditBalance: 0 };
const receiver = { id: 'laura', name: 'Laura', avatarUrl: '', creditBalance: 0 };
const product = {
  id: 1,
  title: 'Perfume',
  price: 100_000,
  imageUrl: '',
  category: 'Belleza',
  stock: 5,
};

function makeGift(overrides: Partial<GiftWithRelations> = {}): GiftWithRelations {
  return {
    id: 'gift-1',
    senderId: sender.id,
    receiverId: receiver.id,
    budget: 150_000,
    message: 'Para ti',
    status: GiftStatus.SENT,
    chosenProductId: null,
    creditGenerated: null,
    thankYouMessage: null,
    openedAt: null,
    chosenAt: null,
    expiresAt: new Date(),
    createdAt: new Date(),
    sender,
    receiver,
    chosenProduct: null,
    options: [{ giftId: 'gift-1', productId: product.id, position: 0, product }],
    payments: [
      {
        id: 'pay-1',
        giftId: 'gift-1',
        amount: 150_000,
        status: PaymentStatus.APPROVED,
        last4: '4242',
        failureReason: null,
        idempotencyKey: 'key-1',
        createdAt: new Date(),
        resolvedAt: new Date(),
      },
    ],
    ...overrides,
  };
}

describe('toViewerGift', () => {
  it('quien regala ve el cofre completo', () => {
    const gift = makeGift();

    const view = toViewerGift(gift, sender.id);

    expect(view).toEqual(gift);
  });

  it('quien recibe no ve las opciones antes de abrir el cofre', () => {
    const view = toViewerGift(makeGift({ status: GiftStatus.SENT }), receiver.id);

    expect(view.options).toEqual([]);
  });

  it('quien recibe ve las opciones después de abrirlo', () => {
    const view = toViewerGift(makeGift({ status: GiftStatus.OPENED }), receiver.id);

    expect(view.options).toHaveLength(1);
  });

  it('quien recibe nunca ve el presupuesto ni los pagos', () => {
    for (const status of [GiftStatus.SENT, GiftStatus.OPENED, GiftStatus.CHOSEN]) {
      const view = toViewerGift(makeGift({ status }), receiver.id);

      expect(view).not.toHaveProperty('budget');
      expect(view).not.toHaveProperty('payments');
    }
  });
});