import type { GiftEvent } from '../api/types';

// ? Qué notificación ve cada persona según el evento (null = ninguna)
export function toastFor({ type, gift }: GiftEvent, userId: string): string | null {
  const isSender = gift.senderId === userId;

  if (!isSender) {
    return type === 'payment_approved'
      ? `🎁 ${gift.sender.name} te envió un cofre`
      : null;
  }

  switch (type) {
    case 'payment_approved':
      return `✅ Pago aprobado. Tu cofre llegó a ${gift.receiver.name}`;
    case 'payment_rejected':
      return '❌ El pago fue rechazado';
    case 'payment_pending':
      return '⏳ Estamos verificando tu pago';
    case 'gift_opened':
      return `👀 ${gift.receiver.name} abrió tu cofre`;
    case 'gift_chosen':
      return `💛 ${gift.receiver.name} eligió ${gift.chosenProduct?.title ?? 'su regalo'}`;
    case 'gift_thanked':
      return `💌 ${gift.receiver.name} te agradeció`;
  }
}