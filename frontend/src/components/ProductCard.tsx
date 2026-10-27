import type { Product } from '../api/types';
import { formatCOP } from '../lib/format';

interface ProductCardProps {
  product: Product;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}

export function ProductCard({ product, selected, disabled, onToggle }: ProductCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={selected}
      className={`relative flex flex-col overflow-hidden rounded-2xl border bg-white text-left transition disabled:opacity-40 ${
        selected
          ? 'border-rose-500 ring-2 ring-rose-500'
          : 'border-stone-200 hover:border-stone-300'
      }`}
    >
      <img
        src={product.imageUrl}
        alt={product.title}
        loading="lazy"
        className="aspect-square w-full bg-stone-50 object-contain p-2"
      />
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium text-stone-800">{product.title}</p>
        <p className="mt-1 text-sm font-semibold text-rose-600">{formatCOP(product.price)}</p>
      </div>
      {selected && (
        <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-rose-500 text-xs font-bold text-white">
          ✓
        </span>
      )}
    </button>
  );
}