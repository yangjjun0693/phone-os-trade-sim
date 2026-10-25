import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Package, ShoppingBag, TriangleAlert } from 'lucide-react';
import { products } from '@/data';
import { generateMarketOffers, type MarketOffer } from '@/game/trade';
import { AnimatedNumber, Burst } from '@/components';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/utils/cn';
import { formatCash } from '@/utils/format';
import { haptic } from '@/utils/haptics';
import { SPRING_BOUNCY, SPRING_SNAPPY } from '@/utils/motion';
import type { MarketSite } from '@/types';

interface Feedback {
  tone: 'ok' | 'warn' | 'error';
  text: string;
}

/**
 * The buy side of the loop. Offers are stable per market and in-game day, so a
 * player can compare sites without the stock rerolling on every visit.
 */
export function MarketOffers({ market }: { market: MarketSite }) {
  const day = useGameStore((s) => s.day);
  const cash = useGameStore((s) => s.cash);
  const purchases = useGameStore((s) => s.purchases);
  const status = useGameStore((s) => s.status);
  const buyMarketOffer = useGameStore((s) => s.buyMarketOffer);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [burstId, setBurstId] = useState<string | null>(null);

  const offers = useMemo(
    () => generateMarketOffers(market, products, day),
    [market, day],
  );

  const buy = (offer: MarketOffer) => {
    const result = buyMarketOffer(offer, market.status);
    if (!result.ok) {
      haptic(12);
      setFeedback({ tone: 'error', text: result.error ?? '주문하지 못했습니다.' });
      return;
    }
    const outcome = result.outcome;
    haptic(outcome?.deliveredQty ? 8 : [10, 40, 10]);
    if (outcome?.deliveredQty) {
      setBurstId(offer.id);
      window.setTimeout(() => setBurstId(null), 900);
    }
    setFeedback({
      tone: outcome?.kind === 'delivered' ? 'ok' : 'warn',
      text: outcome?.message ?? '주문을 처리했습니다.',
    });
  };

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h3 className="text-[15px] font-semibold">오늘의 매물</h3>
        <span className="text-[11px] text-ios-muted">Day {day} · 매일 교체</span>
      </div>

      <div className="space-y-2">
        {offers.map((offer, index) => {
          const bought = (purchases[offer.id] ?? 0) >= offer.qty;
          const total = Math.round(offer.unitPrice * offer.qty);
          const canAfford = cash >= total;
          const disabled = bought || !canAfford || status !== 'playing';

          return (
            <motion.div
              key={offer.id}
              layout
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...SPRING_SNAPPY, delay: index * 0.06 }}
              className="relative overflow-hidden rounded-2xl bg-ios-surface p-3.5 shadow-sm ring-1 ring-black/5 dark:ring-white/5"
            >
              <Burst show={burstId === offer.id} radius={70} />
              <div className="relative flex items-start gap-3">
                <motion.span
                  animate={bought ? { rotate: [0, -8, 0], scale: [1, 1.08, 1] } : { rotate: 0, scale: 1 }}
                  transition={SPRING_BOUNCY}
                  className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-ios-accent/10"
                >
                  <Package className="size-4 text-ios-accent" aria-hidden />
                </motion.span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[15px] font-semibold">{offer.name}</p>
                    <span className="shrink-0 text-[13px] text-ios-muted">×{offer.qty}</span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-ios-muted">
                    개당 {formatCash(offer.unitPrice)} · 시세 {formatCash(offer.marketPrice)}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <AnimatedNumber
                      value={total}
                      format={formatCash}
                      className="text-[14px] font-semibold"
                    />
                    <motion.button
                      type="button"
                      disabled={disabled}
                      onClick={() => buy(offer)}
                      whileTap={disabled ? undefined : { scale: 0.94 }}
                      transition={SPRING_BOUNCY}
                      className={cn(
                        'flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-colors',
                        disabled
                          ? 'bg-ios-separator/20 text-ios-muted'
                          : 'bg-ios-accent text-white',
                      )}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {bought ? (
                          <motion.span
                            key="bought"
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-1.5"
                          >
                            <Check className="size-3.5" aria-hidden />
                            매입 완료
                          </motion.span>
                        ) : (
                          <motion.span
                            key="order"
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-1.5"
                          >
                            <ShoppingBag className="size-3.5" aria-hidden />
                            {canAfford ? '주문' : '현금 부족'}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {feedback ? (
          <motion.div
            key={feedback.text}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={SPRING_SNAPPY}
            className={cn(
              'mt-2 flex items-start gap-2 rounded-xl px-3 py-2 text-[12px]',
              feedback.tone === 'ok' && 'bg-ios-green/10 text-ios-green',
              feedback.tone === 'warn' && 'bg-ios-orange/10 text-ios-orange',
              feedback.tone === 'error' && 'bg-ios-red/10 text-ios-red',
            )}
            role="status"
          >
            {feedback.tone !== 'ok' ? (
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            ) : null}
            <span>{feedback.text}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <p className="mt-2 px-1 text-[11px] text-ios-muted">
        모든 상품과 사이트는 허구입니다. 결제는 게임 안의 가짜 현금으로만 이루어집니다.
      </p>
    </div>
  );
}
