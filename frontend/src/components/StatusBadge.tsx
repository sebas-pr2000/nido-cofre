import type { GiftStatus } from '../api/types';

const STATUS_STYLES: Record<GiftStatus, { text: string; className: string }> = {
  PAYMENT_PENDING: { text: 'Pago pendiente', className: 'bg-amber-100 text-amber-800' },
  PAYMENT_REJECTED: { text: 'Pago rechazado', className: 'bg-red-100 text-red-700' },
  SENT: { text: 'Entregado', className: 'bg-sky-100 text-sky-800' },
  OPENED: { text: 'Abierto', className: 'bg-violet-100 text-violet-800' },
  CHOSEN: { text: 'Elegido', className: 'bg-emerald-100 text-emerald-800' },
  EXPIRED: { text: 'Expirado', className: 'bg-stone-200 text-stone-600' },
};

export function StatusBadge({ status }: { status: GiftStatus }) {
  const { text, className } = STATUS_STYLES[status];
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {text}
    </span>
  );
}