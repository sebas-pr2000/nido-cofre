import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getReceivedGifts } from '../api/endpoints';
import type { Gift, GiftStatus } from '../api/types';
import { useSession } from '../context/SessionContext';
import { useGiftEvents } from '../realtime/RealtimeProvider';

// Quien recibe nunca ve los estados de pago, por eso es Partial
const RECEIVER_LABELS: Partial<Record<GiftStatus, { text: string; className: string }>> = {
  SENT: { text: 'Sin abrir', className: 'bg-rose-100 text-rose-700' },
  OPENED: { text: 'Por elegir', className: 'bg-violet-100 text-violet-800' },
  CHOSEN: { text: 'Elegido', className: 'bg-emerald-100 text-emerald-800' },
  EXPIRED: { text: 'Expirado', className: 'bg-stone-200 text-stone-600' },
};

export function InboxPage() {
  const { currentUser } = useSession();
  const userId = currentUser?.id;
  const [gifts, setGifts] = useState<Gift[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    getReceivedGifts(userId)
      .then((data) => {
        if (!cancelled) setGifts(data);
      })
      .catch(() => {
        if (!cancelled) setError('No pudimos cargar tus cofres');
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Un cofre nuevo aparece arriba; uno existente se actualiza
  useGiftEvents((event) => {
    if (event.gift.receiverId !== userId) return;
    setGifts((prev) => {
      if (!prev) return prev;
      const exists = prev.some((g) => g.id === event.gift.id);
      return exists
        ? prev.map((g) => (g.id === event.gift.id ? event.gift : g))
        : [event.gift, ...prev];
    });
  });

  if (error) return <p className="text-center text-red-600">{error}</p>;
  if (!gifts) return <p className="text-center text-stone-500">Cargando…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Cofres recibidos</h1>

      {gifts.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-5xl">📭</p>
          <p className="mt-3 text-stone-500">Aún no tienes cofres.</p>
          <p className="text-sm text-stone-400">Cuando alguien te envíe uno, aparecerá aquí al instante.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {gifts.map((gift) => {
            const label = RECEIVER_LABELS[gift.status];
            const unopened = gift.status === 'SENT';
            return (
              <li key={gift.id} className="motion-safe:animate-reveal">
                <Link
                  to={`/gifts/${gift.id}`}
                  className={`flex items-center gap-3 rounded-2xl border bg-white p-3 transition hover:border-rose-300 ${
                    unopened ? 'border-rose-300 shadow-sm' : 'border-stone-200'
                  }`}
                >
                  <span
                    className={`grid size-12 shrink-0 place-items-center rounded-full bg-rose-50 text-2xl ${
                      unopened ? 'motion-safe:animate-bounce' : ''
                    }`}
                  >
                    {gift.chosenProduct ? (
                      <img
                        src={gift.chosenProduct.imageUrl}
                        alt=""
                        className="size-10 rounded-full object-contain"
                      />
                    ) : (
                      '🎁'
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-800">
                      De {gift.sender.name}
                    </p>
                    <p className="text-xs text-stone-500">
                      {new Date(gift.createdAt).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  {label && (
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${label.className}`}>
                      {label.text}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}