import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { GiftStatus, PaymentStatus, Prisma, type Payment } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CheckoutDto } from '../gifts/dto/checkout.dto.js';
import { PENDING_RESOLUTION_MS, simulateGateway } from './payment-simulator.js';

import { GiftNotifier } from '../realtime/gift-notifier.service.js';
import { GiftEventType } from '../realtime/gift-events.js';

const EVENT_FOR_PAYMENT: Record<PaymentStatus, GiftEventType> = {
  APPROVED: 'payment_approved',
  REJECTED: 'payment_rejected',
  PENDING: 'payment_pending',
};

// ? Un cofre se puede pagar si nunca se pagó o si el intento anterior fue rechazado
const PAYABLE_STATUSES: GiftStatus[] = [
  GiftStatus.PAYMENT_PENDING,
  GiftStatus.PAYMENT_REJECTED,
];

function giftStatusFor(status: PaymentStatus): GiftStatus {
  switch (status) {
    case PaymentStatus.APPROVED:
      return GiftStatus.SENT;
    case PaymentStatus.REJECTED:
      return GiftStatus.PAYMENT_REJECTED;
    case PaymentStatus.PENDING:
      return GiftStatus.PAYMENT_PENDING;
  }
}

@Injectable()
export class PaymentsService implements OnModuleInit {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: GiftNotifier,
  ) {}

  // ? Si el servidor se reinició con pagos pendientes, se reprograman
  async onModuleInit() {
    const pending = await this.prisma.payment.findMany({
      where: { status: PaymentStatus.PENDING },
    });
    pending.forEach((p) => this.schedulePendingResolution(p.id));
  }

  async checkout(giftId: string, dto: CheckoutDto): Promise<void> {
    // ? 1. Idempotencia: ya procesamos este mismo intento?
    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existing) {
      if (existing.giftId !== giftId) {
        throw new ConflictException('Esta llave de pago ya se usó en otro cofre');
      }
      return; // ! Mismo intento repetido: no se cobra de nuevo
    }

    // ? 2. Validaciones de negocio
    const gift = await this.prisma.gift.findUnique({
      where: { id: giftId },
      include: { payments: { where: { status: PaymentStatus.PENDING } } },
    });

    if (!gift || gift.senderId !== dto.payerId) {
      throw new NotFoundException('Cofre no encontrado');
    }
    if (!PAYABLE_STATUSES.includes(gift.status)) {
      throw new ConflictException('Este cofre ya fue pagado');
    }
    if (gift.payments.length > 0) {
      throw new ConflictException('Ya hay un pago en proceso para este cofre');
    }

    // ? 3. "Llamar" al gateway
    const result = simulateGateway(dto.cardNumber);

    // ? 4. Guardar pago y actualizar cofre en una sola transacción
    let payment: Payment;
    try {
      payment = await this.prisma.$transaction(async (tx) => {
        const created = await tx.payment.create({
          data: {
            giftId,
            amount: gift.budget,
            status: result.status,
            last4: dto.cardNumber.slice(-4),
            failureReason: result.failureReason,
            idempotencyKey: dto.idempotencyKey,
            resolvedAt: result.status === PaymentStatus.PENDING ? null : new Date(),
          },
        });

        await tx.gift.update({
          where: { id: giftId },
          data: { status: giftStatusFor(result.status) },
        });

        return created;
      });
    } catch (e) {
      // ! Doble clic simultáneo con la misma llave: la BD rechazó el duplicado
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        return;
      }
      throw e;
    }

    // ? 5. Si quedó pendiente, se resuelve más tarde
    if (payment.status === PaymentStatus.PENDING) {
      this.schedulePendingResolution(payment.id);
    }

    // ? Paso 6: aquí notificaremos por Socket.io
    await this.notifier.notify(giftId, EVENT_FOR_PAYMENT[payment.status]);
  }

  private schedulePendingResolution(paymentId: string) {
    setTimeout(() => void this.resolvePending(paymentId), PENDING_RESOLUTION_MS);
  }

  private async resolvePending(paymentId: string) {
    try {
        // ? Solo se actualiza si sigue PENDING (evita resolverlo dos veces)
        const giftId = await this.prisma.$transaction(async (tx) => {
        const { count } = await tx.payment.updateMany({
            where: { id: paymentId, status: PaymentStatus.PENDING },
            data: { status: PaymentStatus.APPROVED, resolvedAt: new Date() },
        });
        if (count === 0) return null;

        const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
        await tx.gift.update({
            where: { id: payment.giftId },
            data: { status: GiftStatus.SENT },
        });
        return payment.giftId;
        });

        if (giftId) {
        await this.notifier.notify(giftId, 'payment_approved');
        }
    } catch (e) {
        this.logger.error(`No se pudo resolver el pago ${paymentId}`, e as Error);
    }
    }
}