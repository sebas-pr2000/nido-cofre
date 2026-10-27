import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ApiError } from '../api/client';
import { createGift, getProducts } from '../api/endpoints';
import type { Product } from '../api/types';
import { ProductCard } from '../components/ProductCard';
import { useSession } from '../context/SessionContext';
import { formatCOP } from '../lib/format';

const BUDGETS = [80_000, 150_000, 250_000, 400_000];
const CATEGORIES = ['Moda', 'Tecnología', 'Hogar', 'Belleza'];
const OPTIONS_REQUIRED = 3;
const MESSAGE_MAX = 280;

export function CreateGiftPage() {
  const { currentUser, users } = useSession();
  const navigate = useNavigate();

  const recipients = users.filter((u) => u.id !== currentUser?.id);

  const [searchParams] = useSearchParams();
  const reciprocateTo = recipients.find((u) => u.id === searchParams.get('to'));
  const [receiverId, setReceiverId] = useState(reciprocateTo?.id ?? recipients[0]?.id ?? '');
  const [budget, setBudget] = useState(150_000);
  const [category, setCategory] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selected, setSelected] = useState<Product[]>([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recargar el catálogo cuando cambian presupuesto o categoría
  useEffect(() => {
    let cancelled = false;
    setLoadingProducts(true);

    getProducts({ category: category || undefined, maxPrice: budget })
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch(() => {
        if (!cancelled) setError('No pudimos cargar el catálogo');
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [budget, category]);

  function changeBudget(value: number) {
    setBudget(value);
    // Si baja el presupuesto, se quitan las opciones que ya no caben
    setSelected((prev) => prev.filter((p) => p.price <= value));
  }

  function toggleProduct(product: Product) {
    setSelected((prev) => {
      if (prev.some((p) => p.id === product.id)) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= OPTIONS_REQUIRED) return prev;
      return [...prev, product];
    });
  }

  const receiver = recipients.find((u) => u.id === receiverId);
  const isFull = selected.length >= OPTIONS_REQUIRED;
  const canSubmit =
    selected.length === OPTIONS_REQUIRED &&
    message.trim().length > 0 &&
    receiverId !== '' &&
    !submitting;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!currentUser || !canSubmit) return;

    setSubmitting(true);
    setError(null);
    try {
      const gift = await createGift({
        senderId: currentUser.id,
        receiverId,
        budget,
        message: message.trim(),
        productIds: selected.map((p) => p.id),
      });
      navigate(`/gifts/${gift.id}/checkout`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos crear el cofre');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="pb-28">
      <h1 className="text-2xl font-bold text-stone-900">
        {reciprocateTo ? `Devuélvele el gesto a ${reciprocateTo.name}` : 'Arma un cofre'}
      </h1>
      <p className="mt-1 text-sm text-stone-600">
        Elige 3 opciones. {receiver?.name ?? 'Quien recibe'} abrirá el cofre y escogerá
        la que más le guste. Lo que sobre del presupuesto queda como saldo Nido para
        su próxima compra.
      </p>

      {/* Para quién */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold text-stone-700">¿Para quién?</h2>
        <div className="mt-2 flex gap-2">
          {recipients.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => setReceiverId(user.id)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                receiverId === user.id
                  ? 'border-rose-500 bg-rose-50 text-rose-700'
                  : 'border-stone-200 bg-white text-stone-700'
              }`}
            >
              <img src={user.avatarUrl} alt="" className="size-6 rounded-full" />
              {user.name}
            </button>
          ))}
        </div>
      </section>

      {/* Presupuesto */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold text-stone-700">Presupuesto</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {BUDGETS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => changeBudget(value)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                budget === value
                  ? 'border-rose-500 bg-rose-600 text-white'
                  : 'border-stone-200 bg-white text-stone-700'
              }`}
            >
              {formatCOP(value)}
            </button>
          ))}
        </div>
      </section>

      {/* Mensaje */}
      <section className="mt-6">
        <label htmlFor="message" className="text-sm font-semibold text-stone-700">
          Tu mensaje
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={MESSAGE_MAX}
          rows={3}
          placeholder="Escribe algo que le saque una sonrisa…"
          className="mt-2 w-full rounded-xl border border-stone-200 bg-white p-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
        <p className="text-right text-xs text-stone-400">
          {message.length}/{MESSAGE_MAX}
        </p>
      </section>

      {/* Opciones */}
      <section className="mt-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-stone-700">Opciones del cofre</h2>
          <span className="text-sm font-medium text-rose-600">
            {selected.length}/{OPTIONS_REQUIRED}
          </span>
        </div>

        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {['', ...CATEGORIES].map((cat) => (
            <button
              key={cat || 'all'}
              type="button"
              onClick={() => setCategory(cat)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                category === cat ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              {cat || 'Todo'}
            </button>
          ))}
        </div>

        {loadingProducts ? (
          <p className="mt-6 text-center text-sm text-stone-500">Cargando productos…</p>
        ) : products.length === 0 ? (
          <p className="mt-6 text-center text-sm text-stone-500">
            No hay productos en esta categoría para ese presupuesto.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {products.map((product) => {
              const isSelected = selected.some((p) => p.id === product.id);
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  selected={isSelected}
                  disabled={isFull && !isSelected}
                  onToggle={() => toggleProduct(product)}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Barra fija inferior */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3">
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-rose-600 py-3 font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {submitting
              ? 'Creando cofre…'
              : selected.length < OPTIONS_REQUIRED
                ? `Elige ${OPTIONS_REQUIRED - selected.length} opción(es) más`
                : `Continuar al pago · ${formatCOP(budget)}`}
          </button>
        </div>
      </div>
    </form>
  );
}