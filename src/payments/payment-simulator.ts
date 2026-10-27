import { PaymentStatus } from '@prisma/client';

export interface GatewayResult {
  status: PaymentStatus;
  failureReason: string | null;
}

export const TEST_CARDS = {
  APPROVED: '4242',
  REJECTED: '0000',
  PENDING: '1111',
} as const;

export const PENDING_RESOLUTION_MS = 10_000;

export function simulateGateway(cardNumber: string): GatewayResult {
  const last4 = cardNumber.slice(-4);

  switch (last4) {
    case TEST_CARDS.APPROVED:
      return { status: PaymentStatus.APPROVED, failureReason: null };
    case TEST_CARDS.REJECTED:
      return { status: PaymentStatus.REJECTED, failureReason: 'Fondos insuficientes' };
    case TEST_CARDS.PENDING:
      return { status: PaymentStatus.PENDING, failureReason: null };
    default:
      return {
        status: PaymentStatus.REJECTED,
        failureReason: 'Tarjeta no reconocida por el simulador',
      };
  }
}