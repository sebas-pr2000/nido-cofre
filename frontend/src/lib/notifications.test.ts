import { describe, expect, it } from 'vitest';
import type { Gift, GiftEvent, GiftEventType } from '../api/types';
import { toastFor } from './notifications';

const gift = {
  id: 'gift-1',
  senderId: 'andres',
  receiverId: 'laura',
  sender: { id: 'andres', name: 'Andrés', avatarUrl: '', creditBalance: 0 },
  receiver: { id: 'laura', name: 'Laura', avatarUrl: '', creditBalance: 0 },
  chosenProduct: null,
} as Gift;

const event = (type: GiftEventType): GiftEvent => ({ type, gift });

describe('toastFor', () => {
  it('avisa a quien recibe cuando le llega un cofre', () => {
    expect(toastFor(event('payment_approved'), 'laura')).toBe('🎁 Andrés te envió un cofre');
  });

  it('no avisa a quien recibe sobre sus propias acciones', () => {
    for (const type of ['gift_opened', 'gift_chosen', 'gift_thanked'] as const) {
      expect(toastFor(event(type), 'laura')).toBeNull();
    }
  });

  it('no le cuenta a quien recibe sobre pagos rechazados o pendientes', () => {
    expect(toastFor(event('payment_rejected'), 'laura')).toBeNull();
    expect(toastFor(event('payment_pending'), 'laura')).toBeNull();
  });

  it('avisa a quien regala cuando abren su cofre', () => {
    expect(toastFor(event('gift_opened'), 'andres')).toBe('👀 Laura abrió tu cofre');
  });
});