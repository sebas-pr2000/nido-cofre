import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '../api/client';
import { chooseOption, getGift, openGift, thankGift } from '../api/endpoints';
import type { Gift } from '../api/types';
import { useSession } from '../context/SessionContext';
import { formatCOP } from '../lib/format';
import { wait } from '../lib/wait';

const OPEN_ANIMATION_MS = 1200;
const THANKS_SUGGESTIONS = [
  '¡Me encantó! 💛',
  '¡Acertaste totalmente!',
  'Gracias por pensar en mí ✨',
];

interface ReceiverGiftViewProps {
  gift: Gift;
  onGiftChange: (gift: Gift) => void;
}

function errorMessage(err: unknown) {
  return err instanceof ApiError ? err.message : 'Algo salió mal, intenta de nuevo';
}

export function ReceiverGiftView({ gift, onGiftChange }: ReceiverGiftViewProps) {
  const { currentUser, refreshUsers } = useSession();
  const navigate = useNavigate();

  const [opening, setOpening] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [thanks, setThanks] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser) return null;

  const userId = currentUser.id;
  const sender = gift.sender;

  async function handleOpen() {
    setOpening(true);
    setError(null);
    try {
      // ? La animación dura al menos 1,2 s aunque la API responda antes
      const [updated] = await Promise.all([
        openGift(gift.id, userId),
        wait(OPEN_ANIMATION_MS),
      ]);
      onGiftChange(updated);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setOpening(false);
    }
  }

  async function handleChoose() {
    if (selectedId === null) return;
    setBusy(true);
    setError(null);
    try {
      onGiftChange(await chooseOption(gift.id, userId, selectedId));
      await refreshUsers(); // ? Actualiza el saldo en el header
    } catch (err) {
      setError(errorMessage(err));
      setSelectedId(null);
      // ? Recargar por si cambió el stock (por ejemplo, se agotó la opción)
      onGiftChange(await getGift(gift.id, userId).catch(() => gift));
    } finally {
      setBusy(false);
    }
  }

  async function handleThanks(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const message = thanks.trim();
    if (!message) return;

    setBusy(true);
    setError(null);
    try {
      onGiftChange(await thankGift(gift.id, userId, message));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const errorBox = error && (
    <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
  );

  // * 1. Cofre cerrado 
  if (gift.status === 'SENT') {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <img src={sender.avatarUrl} alt="" className="size-14 rounded-full bg-rose-100" />
        <p className="mt-3 text-lg font-semibold text-stone-800">
          {sender.name} te envió un cofre
        </p>
        <p className="mt-1 max-w-xs text-sm text-stone-500">
          Adentro hay 3 opciones elegidas para ti. Tú decides cuál te llevas.
        </p>

        <button
          type="button"
          onClick={handleOpen}
          disabled={opening}
          aria-label="Abrir el cofre"
          className={`mt-10 select-none text-9xl transition ${
            opening ? 'motion-safe:animate-shake' : 'motion-safe:animate-bounce hover:scale-110'
          }`}
        >
          🎁
        </button>

        <p className="mt-8 font-semibold text-rose-600">
          {opening ? 'Abriendo…' : 'Toca el cofre para abrirlo'}
        </p>
        <p className="mt-2 text-xs text-stone-400">
          Disponible hasta el {new Date(gift.expiresAt).toLocaleDateString('es-CO')}
        </p>
        <div className="mt-4 w-full">{errorBox}</div>
      </div>
    );
  }

  // * 2. Cofre abierto: elegir 
  if (gift.status === 'OPENED') {
    return (
      <div className="pb-28">
        <div className="rounded-2xl border border-rose-100 bg-white p-4 motion-safe:animate-reveal">
          <p className="text-sm italic text-stone-700">“{gift.message}”</p>
          <p className="mt-2 text-xs font-medium text-stone-500">— {sender.name}</p>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-stone-900">Elige tu regalo</h1>
        <p className="mt-1 text-sm text-stone-600">
          Si eliges una opción más económica, la diferencia queda como saldo Nido para ti.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gift.options.map((option, index) => {
            const soldOut = option.product.stock <= 0;
            const isSelected = selectedId === option.productId;
            return (
              <button
                key={option.productId}
                type="button"
                disabled={soldOut || busy}
                onClick={() => setSelectedId(option.productId)}
                aria-pressed={isSelected}
                style={{ animationDelay: `${index * 150}ms` }}
                className={`relative overflow-hidden rounded-2xl border bg-white text-left transition motion-safe:animate-reveal disabled:opacity-40 ${
                  isSelected ? 'border-rose-500 ring-2 ring-rose-500' : 'border-stone-200'
                }`}
              >
                <img
                  src={option.product.imageUrl}
                  alt={option.product.title}
                  className="aspect-square w-full bg-stone-50 object-contain p-2"
                />
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-medium text-stone-800">
                    {option.product.title}
                  </p>
                  {soldOut && (
                    <p className="mt-1 text-xs font-semibold text-red-600">Agotado</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4">{errorBox}</div>

        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white/95 backdrop-blur">
          <div className="mx-auto max-w-2xl px-4 py-3">
            <button
              type="button"
              onClick={handleChoose}
              disabled={selectedId === null || busy}
              className="w-full rounded-xl bg-rose-600 py-3 font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {busy ? 'Confirmando…' : selectedId === null ? 'Toca una opción' : 'Quiero este 💛'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // * 3. Elegido: celebrar, agradecer y devolver el gesto 
  if (gift.status === 'CHOSEN' && gift.chosenProduct) {
    const credit = gift.creditGenerated ?? 0;

    return (
      <div className="space-y-6">
        <div className="text-center motion-safe:animate-reveal">
          <p className="text-5xl">🎉</p>
          <h1 className="mt-2 text-2xl font-bold text-stone-900">¡Es tuyo!</h1>
          <img
            src={gift.chosenProduct.imageUrl}
            alt={gift.chosenProduct.title}
            className="mx-auto mt-4 aspect-square w-48 rounded-2xl bg-white object-contain p-3 shadow-sm"
          />
          <p className="mt-3 font-semibold text-stone-800">{gift.chosenProduct.title}</p>
          <p className="text-sm text-stone-500">Regalo de {sender.name}</p>
        </div>

        {credit > 0 && (
          <div className="rounded-2xl bg-emerald-50 p-4 text-center">
            <p className="text-sm text-emerald-800">Además, te quedaron</p>
            <p className="text-2xl font-bold text-emerald-700">{formatCOP(credit)}</p>
            <p className="text-sm text-emerald-800">de saldo Nido para tu próxima compra</p>
          </div>
        )}

        {gift.thankYouMessage ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <p className="text-xs font-medium text-stone-500">Le enviaste a {sender.name}:</p>
            <p className="mt-1 text-sm italic text-stone-700">“{gift.thankYouMessage}”</p>
          </div>
        ) : (
          <form onSubmit={handleThanks} className="rounded-2xl border border-stone-200 bg-white p-4">
            <label htmlFor="thanks" className="text-sm font-semibold text-stone-700">
              Dale las gracias a {sender.name}
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {THANKS_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setThanks(suggestion)}
                  className="rounded-full border border-stone-200 px-3 py-1 text-xs text-stone-700 hover:border-rose-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <textarea
              id="thanks"
              value={thanks}
              onChange={(e) => setThanks(e.target.value)}
              maxLength={280}
              rows={2}
              placeholder="O escribe tu propio mensaje…"
              className="mt-3 w-full rounded-xl border border-stone-200 p-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
            <button
              type="submit"
              disabled={!thanks.trim() || busy}
              className="mt-2 w-full rounded-xl bg-stone-900 py-2.5 text-sm font-semibold text-white disabled:bg-stone-300"
            >
              {busy ? 'Enviando…' : 'Enviar agradecimiento'}
            </button>
          </form>
        )}

        {errorBox}

        <div className="rounded-2xl bg-rose-600 p-5 text-center text-white">
          <p className="text-lg font-bold">Devuélvele el gesto</p>
          <p className="mt-1 text-sm text-rose-100">
            Sorprende a {sender.name} con un cofre armado por ti.
          </p>
          <button
            type="button"
            onClick={() => navigate(`/new?to=${sender.id}`)}
            className="mt-4 rounded-xl bg-white px-5 py-2.5 font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            Armar un cofre para {sender.name}
          </button>
        </div>
      </div>
    );
  }

  // * 4. Expirado 
  return (
    <div className="py-10 text-center">
      <p className="text-5xl">⌛</p>
      <p className="mt-3 font-semibold text-stone-800">Este cofre expiró</p>
      <p className="text-sm text-stone-500">Ya no está disponible para abrir.</p>
    </div>
  );
}