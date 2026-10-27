import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { io } from 'socket.io-client';
import type { GiftEvent } from '../api/types';
import { toastFor } from '../lib/notifications';

type Listener = (event: GiftEvent) => void;

interface RealtimeValue {
  connected: boolean;
  subscribe: (listener: Listener) => () => void;
}

interface Toast {
  id: string;
  text: string;
}

const TOAST_DURATION_MS = 5000;

const RealtimeContext = createContext<RealtimeValue | null>(null);

export function RealtimeProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const listenersRef = useRef(new Set<Listener>());
  const [connected, setConnected] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, { auth: { userId } });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('gift:event', (event: GiftEvent) => {
      // ? 1. Avisar a las pantallas suscritas
      listenersRef.current.forEach((listener) => listener(event));

      // ? 2. Mostrar notificación si aplica
      const text = toastFor(event, userId);
      if (text) {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { id, text }]);
        setTimeout(
          () => setToasts((prev) => prev.filter((t) => t.id !== id)),
          TOAST_DURATION_MS,
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  const subscribe = useCallback((listener: Listener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const value = useMemo(() => ({ connected, subscribe }), [connected, subscribe]);

  return (
    <RealtimeContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto w-full max-w-sm rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-lg"
          >
            {toast.text}
          </div>
        ))}
      </div>
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error('useRealtime debe usarse dentro de <RealtimeProvider>');
  }
  return ctx;
}

// ? Hook para que cualquier pantalla reaccione a los eventos
export function useGiftEvents(handler: Listener) {
  const { subscribe } = useRealtime();
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => subscribe((event) => handlerRef.current(event)), [subscribe]);
}