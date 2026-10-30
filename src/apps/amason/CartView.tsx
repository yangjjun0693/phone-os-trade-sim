import { useMemo } from 'react';
import { Minus, Plus, ShieldCheck, Trash2, TriangleAlert } from 'lucide-react';
import { findAmasonProduct, usdToKrw, type AmasonProduct } from '@/content/amason';
import { useGameStore } from '@/store/gameStore';
import { useAmasonStore, type AmasonOrder } from '@/store/amasonStore';
import { formatCash } from '@/utils/format';
import { haptic } from '@/utils/haptics';
import { CtaButton } from './parts';
import { AMASON_LINK, krwHint, usd } from './theme';
import { ProductThumb } from './ProductThumb';

interface Line {
  product: AmasonProduct;
  qty: number;
}

/** The cart: line items, the subtotal, and the one button that spends money. */
export function CartView({ onPlaced, onBrowse }: { onPlaced: (order: AmasonOrder) => void; onBrowse: () => void }) {
  const cash = useGameStore((s) => s.cash);
  const addCash = useGameStore((s) => s.addCash);
  const gameDateTime = useGameStore((s) => s.gameDateTime);
  const cart = useAmasonStore((s) => s.cart);
  const setQty = useAmasonStore((s) => s.setQty);
  const removeFromCart = useAmasonStore((s) => s.removeFromCart);
  const placeOrder = useAmasonStore((s) => s.placeOrder);

  const lines = useMemo<Line[]>(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const product = findAmasonProduct(id);
          return product ? { product, qty } : null;
        })
        .filter((line): line is Line => Boolean(line)),
    [cart],
  );

  const itemCount = lines.reduce((sum, line) => sum + line.qty, 0);
  const subtotalUsd = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
  const subtotalKrw = usdToKrw(subtotalUsd);
  const affordable = cash >= subtotalKrw;

  const order = () => {
    if (lines.length === 0 || !affordable) return;
    haptic(10);
    addCash(-subtotalKrw);
    const placed = placeOrder({
      id: `AM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      placedAt: gameDateTime,
      lines: lines.map((line) => ({
        productId: line.product.id,
        qty: line.qty,
        unitPrice: line.product.price,
      })),
    });
    onPlaced(placed);
  };

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-8 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-[#ffd814]/25 text-[#8a6d00]">
          <ShieldCheck className="size-7" aria-hidden />
        </span>
        <p className="text-[16px] font-semibold">Your Amason cart is empty</p>
        <p className="text-[13px] leading-relaxed text-ios-muted">
          Everyday things land here — cables, coffee, a tent. Nothing in this cart touches the trade
          side of your phone.
        </p>
        <CtaButton onClick={onBrowse} className="mt-2">
          Keep shopping
        </CtaButton>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6 pt-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[20px] font-bold text-[#0f1111] dark:text-ios-text">Shopping Cart</h2>
        <button type="button" onClick={onBrowse} className="text-[13px] font-medium" style={{ color: AMASON_LINK }}>
          Keep shopping
        </button>
      </div>

      <ul className="mt-3 space-y-3">
        {lines.map((line) => (
          <li
            key={line.product.id}
            className="flex gap-3 border-t border-ios-separator/15 pt-3 first:border-t-0 first:pt-0"
          >
            <div className="size-[68px] shrink-0 overflow-hidden rounded-xl ring-1 ring-black/5">
              <ProductThumb product={line.product} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[13px] font-medium leading-snug">{line.product.title}</p>
              <p className="mt-0.5 text-[11px] text-ios-muted">{line.product.brand}</p>
              <p className="mt-1 text-[11px] font-semibold text-ios-green">In Stock</p>

              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center rounded-full bg-black/5 dark:bg-white/10">
                  <button
                    type="button"
                    aria-label={`Decrease quantity of ${line.product.title}`}
                    onClick={() => {
                      haptic(4);
                      setQty(line.product.id, line.qty - 1);
                    }}
                    className="flex size-7 items-center justify-center rounded-full"
                  >
                    <Minus className="size-3.5" aria-hidden />
                  </button>
                  <span className="w-6 text-center text-[13px] font-semibold tabular-nums">{line.qty}</span>
                  <button
                    type="button"
                    aria-label={`Increase quantity of ${line.product.title}`}
                    onClick={() => {
                      haptic(4);
                      setQty(line.product.id, line.qty + 1);
                    }}
                    className="flex size-7 items-center justify-center rounded-full"
                  >
                    <Plus className="size-3.5" aria-hidden />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    haptic(6);
                    removeFromCart(line.product.id);
                  }}
                  className="flex items-center gap-1 text-[12px] font-medium"
                  style={{ color: AMASON_LINK }}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Delete
                </button>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[14px] font-bold tabular-nums">{usd(line.product.price * line.qty)}</p>
              <p className="mt-0.5 text-[10px] text-ios-muted tabular-nums">
                {krwHint(usdToKrw(line.product.price * line.qty))}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-2xl bg-ios-surface p-3.5 ring-1 ring-black/5 dark:ring-white/5">
        <div className="flex items-baseline justify-between">
          <span className="text-[14px]">
            Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'}):
          </span>
          <span className="text-[16px] font-bold tabular-nums">{usd(subtotalUsd)}</span>
        </div>
        <p className="mt-0.5 text-right text-[11px] text-ios-muted tabular-nums">
          {krwHint(subtotalKrw)} · charged from your cash
        </p>
        <p className="mt-2 text-[12px] font-medium text-ios-green">
          FREE delivery on this order
        </p>
        <CtaButton onClick={order} disabled={!affordable} className="mt-3 w-full">
          Place your order
        </CtaButton>
        <p className="mt-2 text-center text-[11px] text-ios-muted">
          Cash on hand: <span className="font-semibold tabular-nums">{formatCash(cash)}</span>
        </p>
        {!affordable ? (
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[12px] font-medium text-ios-red">
            <TriangleAlert className="size-3.5" aria-hidden />
            Not enough cash — you need {formatCash(subtotalKrw - cash)} more.
          </p>
        ) : null}
      </div>

      <p className="mt-3 px-1 text-[11px] leading-relaxed text-ios-muted">
        Amason is fiction. Prices are American dollars, paid with the game's own cash, and nothing
        here changes your heat, your stock or your parcels.
      </p>
    </div>
  );
}
