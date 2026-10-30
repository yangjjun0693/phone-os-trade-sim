import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { PackageCheck } from 'lucide-react';
import { findAmasonProduct } from '@/content/amason';
import { useGameStore } from '@/store/gameStore';
import { DELIVERY_STAGE_LABEL, deliveryStage, useAmasonStore, type AmasonOrder } from '@/store/amasonStore';
import { cn } from '@/utils/cn';
import { CtaButton } from './parts';
import { krwHint, usd } from './theme';
import { ProductThumb } from './ProductThumb';

const STAGES = ['processing', 'shipped', 'out-for-delivery', 'delivered'] as const;

function enDate(iso: string): string {
  return format(new Date(iso), 'EEE, MMM d', { locale: enUS });
}

/** "Your Orders": what was bought, where it is, judged by the game clock. */
export function OrdersView({ onBrowse }: { onBrowse: () => void }) {
  const gameDateTime = useGameStore((s) => s.gameDateTime);
  const orders = useAmasonStore((s) => s.orders);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-8 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-[#ffd814]/25 text-[#8a6d00]">
          <PackageCheck className="size-7" aria-hidden />
        </span>
        <p className="text-[16px] font-semibold">No orders yet</p>
        <p className="text-[13px] leading-relaxed text-ios-muted">
          Orders you place show up here with a delivery date that follows the game clock.
        </p>
        <CtaButton onClick={onBrowse} className="mt-2">
          Start shopping
        </CtaButton>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-4 pb-6 pt-3">
      <h2 className="text-[20px] font-bold text-[#0f1111] dark:text-ios-text">Your Orders</h2>

      {orders.map((order) => (
        <OrderCard key={order.id} order={order} nowIso={gameDateTime} />
      ))}
    </div>
  );
}

function OrderCard({ order, nowIso }: { order: AmasonOrder; nowIso: string }) {
  const stage = deliveryStage(order, nowIso);
  const stageIndex = STAGES.indexOf(stage);
  const delivered = stage === 'delivered';
  const items = order.lines
    .map((line) => ({ line, product: findAmasonProduct(line.productId) }))
    .filter((entry): entry is { line: typeof entry.line; product: NonNullable<typeof entry.product> } =>
      Boolean(entry.product),
    );
  const units = order.lines.reduce((sum, line) => sum + line.qty, 0);

  return (
    <article className="rounded-2xl bg-ios-surface p-3.5 ring-1 ring-black/5 dark:ring-white/5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ios-muted">
          Order {order.id}
        </span>
        <span className="text-[11px] text-ios-muted">Placed {enDate(order.placedAt)}</span>
      </div>

      <p className={cn('mt-1 text-[15px] font-semibold', delivered && 'text-ios-green')}>
        {delivered ? `Delivered ${enDate(order.etaAt)}` : `Arriving ${enDate(order.etaAt)}`}
      </p>

      <div className="mt-2.5 flex items-center gap-1" aria-hidden>
        {STAGES.map((step, index) => (
          <span
            key={step}
            className={cn(
              'h-1.5 flex-1 rounded-full',
              index <= stageIndex ? (delivered ? 'bg-ios-green' : 'bg-[#ffa41c]') : 'bg-ios-separator/20',
            )}
          />
        ))}
      </div>
      <p className="mt-1 text-[11px] font-medium text-ios-muted">{DELIVERY_STAGE_LABEL[stage]}</p>

      <div className="mt-3 flex items-center gap-2">
        {items.slice(0, 4).map(({ line, product }) => (
          <div
            key={line.productId}
            className="size-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-black/5"
            title={product.title}
          >
            <ProductThumb product={product} />
          </div>
        ))}
        <div className="min-w-0 flex-1 text-right">
          <p className="text-[13px] font-semibold tabular-nums">{usd(order.totalUsd)}</p>
          <p className="text-[10px] text-ios-muted tabular-nums">{krwHint(order.totalKrw)}</p>
          <p className="text-[10px] text-ios-muted">
            {units} {units === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>
    </article>
  );
}
