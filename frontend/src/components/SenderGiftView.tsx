import { Link } from 'react-router';
import type { Gift, GiftStatus } from '../api/types';
import { formatCOP } from '../lib/format';
import { StatusBadge } from './StatusBadge';

type StepState = 'done' | 'current' | 'pending' | 'error';

interface Step {
  label: string;
  detail?: string;
  state: StepState;
}

const PAID: GiftStatus[] = ['SENT', 'OPENED', 'CHOSEN', 'EXPIRED'];

const DOT_STYLES: Record<StepState, string> = {
  done: 'bg-emerald-500',
  current: 'bg-rose-500 animate-pulse',
  pending: 'bg-stone-200',
  error: 'bg-red-500',
};

function formatTime(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
    : undefined;
}

function buildSteps(gift: Gift): Step[] {
  const name = gift.receiver.name;
  const lastPayment = gift.payments?.[0];
  const paid = PAID.includes(gift.status);

  let paymentStep: Step;
  if (paid) {
    paymentStep = {
      label: 'Pago aprobado',
      detail: lastPayment ? `Tarjeta ···· ${lastPayment.last4}` : undefined,
      state: 'done',
    };
  } else if (gift.status === 'PAYMENT_REJECTED') {
    paymentStep = {
      label: 'Pago rechazado',
      detail: lastPayment?.failureReason ?? undefined,
      state: 'error',
    };
  } else if (lastPayment?.status === 'PENDING') {
    paymentStep = {
      label: 'Verificando el pago…',
      detail: 'Esto toma unos segundos',
      state: 'current',
    };
  } else {
    paymentStep = { label: 'Pago pendiente', state: 'current' };
  }

  const expiredUnopened = gift.status === 'EXPIRED' && !gift.openedAt;

  return [
    paymentStep,
    { label: `Entregado a ${name}`, state: paid ? 'done' : 'pending' },
    expiredUnopened
      ? { label: 'El cofre expiró sin abrirse', state: 'error' }
      : {
          label: `${name} abrió tu cofre`,
          detail: formatTime(gift.openedAt),
          state: gift.openedAt ? 'done' : paid ? 'current' : 'pending',
        },
    {
      label: gift.chosenProduct
        ? `${name} eligió: ${gift.chosenProduct.title}`
        : `${name} elige su regalo`,
      detail: formatTime(gift.chosenAt),
      state: gift.chosenAt ? 'done' : gift.openedAt ? 'current' : 'pending',
    },
    {
      label: gift.thankYouMessage ? `${name} te agradeció` : 'Agradecimiento',
      detail: gift.thankYouMessage ? `“${gift.thankYouMessage}”` : undefined,
      state: gift.thankYouMessage ? 'done' : gift.chosenAt ? 'current' : 'pending',
    },
  ];
}

export function SenderGiftView({ gift }: { gift: Gift }) {
  const steps = buildSteps(gift);
  const name = gift.receiver.name;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/sent" className="text-sm text-stone-500 hover:text-stone-700">
          ← Enviados
        </Link>
        <div className="mt-2 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-stone-900">Cofre para {name}</h1>
          <StatusBadge status={gift.status} />
        </div>
        <p className="mt-3 rounded-xl border border-stone-200 bg-white p-3 text-sm italic text-stone-600">
          “{gift.message}”
        </p>
      </div>

      {/* Línea de tiempo */}
      <ol className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4">
        {steps.map((step, index) => (
          <li key={index} className="flex gap-3">
            <span className={`mt-1.5 size-3 shrink-0 rounded-full ${DOT_STYLES[step.state]}`} />
            <div>
              <p
                className={`text-sm font-medium ${
                  step.state === 'pending' ? 'text-stone-400' : 'text-stone-800'
                }`}
              >
                {step.label}
              </p>
              {step.detail && <p className="text-xs text-stone-500">{step.detail}</p>}
            </div>
          </li>
        ))}
      </ol>

      {gift.status === 'PAYMENT_REJECTED' && (
        <Link
          to={`/gifts/${gift.id}/checkout`}
          className="block rounded-xl bg-rose-600 py-3 text-center font-semibold text-white hover:bg-rose-700"
        >
          Reintentar el pago
        </Link>
      )}

      {gift.creditGenerated !== null && gift.creditGenerated > 0 && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          A {name} le quedaron <strong>{formatCOP(gift.creditGenerated)}</strong> de saldo
          Nido para su próxima compra.
        </p>
      )}

      {/* Opciones */}
      <section>
        <h2 className="text-sm font-semibold text-stone-700">Opciones del cofre</h2>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {gift.options.map((option) => {
            const isChosen = option.productId === gift.chosenProductId;
            const dimmed = gift.chosenProductId !== null && !isChosen;
            return (
              <div
                key={option.productId}
                className={`rounded-xl border bg-white p-2 transition ${
                  isChosen ? 'border-emerald-500 ring-2 ring-emerald-500' : 'border-stone-200'
                } ${dimmed ? 'opacity-40' : ''}`}
              >
                <img
                  src={option.product.imageUrl}
                  alt={option.product.title}
                  className="aspect-square w-full object-contain"
                />
                <p className="mt-1 line-clamp-1 text-xs text-stone-700">{option.product.title}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}