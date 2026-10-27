import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { getGift } from '../api/endpoints';
import type { Gift } from '../api/types';
import { useSession } from '../context/SessionContext';
import { useGiftEvents } from '../realtime/RealtimeProvider';

// ? Carga un cofre y lo mantiene actualizado en vivo
export function useGift(id: string | undefined) {
  const { currentUser } = useSession();
  const userId = currentUser?.id;
  const [gift, setGift] = useState<Gift | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !userId) return;
    let cancelled = false;

    getGift(id, userId)
      .then((data) => {
        if (!cancelled) setGift(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'No pudimos cargar el cofre');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, userId]);

  useGiftEvents((event) => {
    if (event.gift.id === id) setGift(event.gift);
  });

  return { gift, setGift, error };
}