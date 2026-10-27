import { useRef, useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { ApiError } from '../api/client';
import { checkoutGift } from '../api/endpoints';
import type { GiftStatus } from '../api/types';
import { useSession } from '../context/SessionContext';
import { useGift } from '../hooks/useGift';
import { formatCOP } from '../lib/format';
import { TEST_CARDS } from '../lib/testCards';

const PAYABLE: GiftStatus[] = ['PAYMENT_PENDING', 'PAYMENT_REJECTED'];

export function CheckoutPage() {
  const { id } = useParams();
  const { currentUser } = useSession();
  const navigate = useNavigate();
  const { gift, setGift, error: loadError } = useGift(id);

  const [cardNumber, setCardNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  if (loadError) {
    return <p className="text-center text-red-600">{loadError}</p>;
  }
  if (!gift || !currentUser) {
    return <p className="text-center text-stone-500">Cargando…</p>;
  }

  const hasPendingPayment = gift.payments?.some((p) => p.status === 'PENDING') ?? false;
  const canPay =
    gift.senderId === currentUser.id && PAYABLE.includes(gift.status) && !hasPendingPayment;

  // Si ya no hay nada que pagar, a la pantalla de seguimiento
  if (!canPay) {
    return <Navigate to={`/gifts/${gift.id}`} replace />;
  }

  const isValidCard = cardNumber.length === 16;
  const formattedCard = cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');

  async function handlePay(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!gift || !currentUser || submitting || !isValidCard) return;

    // Una llave por intento. Si falla la red, se reutiliza: no se cobra dos veces
    const key = idempotencyKeyRef.current ?? crypto.randomUUID();
    idempotencyKeyRef.current = key;

    setSubmitting(true);
    setError(null);
    try {
      const updated = await checkoutGift(gift.id, {
        payerId: currentUser.id,
        cardNumber,
        idempotencyKey: key,
      });
      idempotencyKeyRef.current = null;

      if (updated.status === 'PAYMENT_REJECTED') {
        setGift(updated);
        setError(updated.payments?.[0]?.failureReason ?? 'El pago fue rechazado');
      } else {
        navigate(`/gifts/${gift.id}`);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        idempotencyKeyRef.current = null;
        setError(err.message);
      } else {
        setError('Problema de conexión. Intenta de nuevo: no se te cobrará dos veces.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Pagar el cofre</h1>
        <p className="mt-1 text-sm text-stone-600">Para {gift.receiver.name}</p>
      </div>

      {/* Resumen */}
      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="grid grid-cols-3 gap-2">
          {gift.options.map((option) => (
            <img
              key={option.productId}
              src={option.product.imageUrl}
              alt={option.product.title}
              className="aspect-square w-full rounded-xl bg-stone-50 object-contain p-1"
            />
          ))}
        </div>
        <p className="mt-3 text-sm italic text-stone-600">“{gift.message}”</p>
        <div className="mt-4 flex items-baseline justify-between border-t border-stone-100 pt-3">
          <span className="text-sm text-stone-600">Total</span>
          <span className="text-xl font-bold text-stone-900">
            {gift.budget !== undefined && formatCOP(gift.budget)}
          </span>
        </div>
        <p className="mt-2 text-xs text-stone-500">
          Si {gift.receiver.name} elige una opción más económica, la diferencia queda
          como saldo Nido para ella.
        </p>
      </section>

      {/* Pago */}
      <form onSubmit={handlePay} className="rounded-2xl border border-stone-200 bg-white p-4">
        <label htmlFor="card" className="text-sm font-semibold text-stone-700">
          Número de tarjeta
        </label>
        <input
          id="card"
          inputMode="numeric"
          autoComplete="off"
          value={formattedCard}
          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
          placeholder="0000 0000 0000 0000"
          className="mt-2 w-full rounded-xl border border-stone-200 p-3 font-mono tracking-wider outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />

        <p className="mt-4 text-xs font-medium text-stone-500">Tarjetas de prueba:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TEST_CARDS.map((card) => (
            <button
              key={card.number}
              type="button"
              onClick={() => setCardNumber(card.number)}
              className="rounded-full border border-stone-200 px-3 py-1 text-xs text-stone-700 hover:border-rose-300"
            >
              {card.label} ···· {card.number.slice(-4)}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={!isValidCard || submitting}
          className="mt-4 w-full rounded-xl bg-rose-600 py-3 font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {submitting
            ? 'Procesando…'
            : `Pagar ${gift.budget !== undefined ? formatCOP(gift.budget) : ''}`}
        </button>
        <p className="mt-3 text-center text-xs text-stone-400">
          Checkout simulado: no se realiza ningún cobro real.
        </p>
      </form>
    </div>
  );
}