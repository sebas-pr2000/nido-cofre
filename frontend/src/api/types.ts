export type GiftStatus =
  | 'PAYMENT_PENDING'
  | 'PAYMENT_REJECTED'
  | 'SENT'
  | 'OPENED'
  | 'CHOSEN'
  | 'EXPIRED';

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  creditBalance: number;
}

export interface Product {
  id: number;
  title: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
}

export interface GiftOption {
  giftId: string;
  productId: number;
  position: number;
  product: Product;
}

export interface Payment {
  id: string;
  amount: number;
  status: PaymentStatus;
  last4: string;
  failureReason: string | null;
  createdAt: string;
}

export interface Gift {
  id: string;
  senderId: string;
  receiverId: string;
  budget?: number;       // ? quien recibe no lo ve
  message: string;
  status: GiftStatus;
  chosenProductId: number | null;
  creditGenerated: number | null;
  thankYouMessage: string | null;
  openedAt: string | null;
  chosenAt: string | null;
  expiresAt: string;
  createdAt: string;
  sender: User;
  receiver: User;
  chosenProduct: Product | null;
  options: GiftOption[];
  payments?: Payment[];  // ? quien recibe no los ve
}

export type GiftEventType =
  | 'payment_approved'
  | 'payment_rejected'
  | 'payment_pending'
  | 'gift_opened'
  | 'gift_chosen'
  | 'gift_thanked';

export interface GiftEvent {
  type: GiftEventType;
  gift: Gift;
}

export interface CreateGiftInput {
  senderId: string;
  receiverId: string;
  budget: number;
  message: string;
  productIds: number[];
}

export interface CheckoutInput {
  payerId: string;
  cardNumber: string;
  idempotencyKey: string;
}