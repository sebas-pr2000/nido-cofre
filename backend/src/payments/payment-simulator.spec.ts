import { PaymentStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { simulateGateway, TEST_CARDS } from './payment-simulator.js';

describe('simulateGateway', () => {
  it.each([
    [TEST_CARDS.APPROVED, PaymentStatus.APPROVED],
    [TEST_CARDS.REJECTED, PaymentStatus.REJECTED],
    [TEST_CARDS.PENDING, PaymentStatus.PENDING],
  ])('una tarjeta terminada en %s queda %s', (last4, expected) => {
    const result = simulateGateway(`424242424242${last4}`);
    // console.log("result", result);

    expect(result.status).toBe(expected);
  });

  it('explica el motivo cuando rechaza por fondos', () => {
    const result = simulateGateway(`400000000000${TEST_CARDS.REJECTED}`);

    expect(result.failureReason).toBe('Fondos insuficientes');
  });

  it('no da motivo de rechazo cuando aprueba', () => {
    const result = simulateGateway(`424242424242${TEST_CARDS.APPROVED}`);

    expect(result.failureReason).toBeNull();
  });

  it('rechaza tarjetas que el simulador no reconoce', () => {
    const result = simulateGateway('5555555555555555');

    expect(result.status).toBe(PaymentStatus.REJECTED);
    expect(result.failureReason).toMatch(/no reconocida/);
  });
});