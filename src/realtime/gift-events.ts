export const GIFT_EVENT = 'gift:event';

export type GiftEventType =
  | 'payment_approved'
  | 'payment_rejected'
  | 'payment_pending'
  | 'gift_opened'
  | 'gift_chosen'
  | 'gift_thanked';