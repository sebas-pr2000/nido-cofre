import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getSentGifts } from '../api/endpoints';
import type { Gift } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { useSession } from '../context/SessionContext';
import { formatCOP } from '../lib/format';
import { useGiftEvents } from '../realtime/RealtimeProvider';

export function SentPage() {
  const { currentUser } = useSession();
  const userId = currentUser?.id;
  const [gifts, setGifts] = useState<Gift[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    getSentGifts(userId)
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

  // Reemplaza en la lista el cofre que cambió
  useGiftEvents((event) => {
    setGifts((prev) => prev?.map((g) => (g.id === event.gift.id ? event.gift : g)) ?? null);
  });

  if (error) return <p className="text-center text-red-600">{error}</p>;
  if (!gifts) return <p className="text-center text-stone-500">Cargando…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Cofres enviados</h1>

      {gifts.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-stone-500">Todavía no has enviado ningún cofre.</p>
          <Link to="/new" className="mt-3 inline-block font-semibold text-rose-600">
            Armar mi primer cofre →
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {gifts.map((gift) => (
            <li key={gift.id}>
              <Link
                to={`/gifts/${gift.id}`}
                className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 transition hover:border-rose-300"
              >
                <div className="flex -space-x-3">
                  {gift.options.map((o) => (
                    <img
                      key={o.productId}
                      src={o.product.imageUrl}
                      alt=""
                      className="size-10 rounded-full border-2 border-white bg-stone-50 object-contain"
                    />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-stone-800">
                    Para {gift.receiver.name}
                  </p>
                  <p className="text-xs text-stone-500">
                    {gift.budget !== undefined && formatCOP(gift.budget)} ·{' '}
                    {new Date(gift.createdAt).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <StatusBadge status={gift.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}