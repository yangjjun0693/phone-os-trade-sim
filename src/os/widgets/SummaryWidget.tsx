import { Flame, Wallet } from 'lucide-react';
import { heatLabel, heatTier } from '@/game';
import { useGameStore } from '@/store/gameStore';
import { formatCompactCash } from '@/utils/format';

const TIER_GRADIENT: Record<ReturnType<typeof heatTier>, string> = {
  calm: 'from-emerald-400 to-green-500',
  watched: 'from-amber-300 to-orange-500',
  hot: 'from-orange-500 to-red-500',
  burned: 'from-red-500 to-rose-600',
};

/** Cash + heat summary widget. Dummy data for now, real economy later. */
export function SummaryWidget() {
  const cash = useGameStore((s) => s.cash);
  const heat = useGameStore((s) => s.heat);
  const tier = heatTier(heat);

  return (
    <div className="glass flex flex-col justify-between gap-2 rounded-[22px] p-3.5 text-ios-text shadow-lg ring-1 ring-inset ring-white/15">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 opacity-70">
          <Wallet className="size-3.5" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-wide">현금</span>
        </div>
        <div className="flex items-center gap-1 opacity-70">
          <Flame className="size-3.5" aria-hidden />
          <span className="text-[11px] font-semibold tabular-nums">{heat}</span>
        </div>
      </div>

      <p className="text-[22px] font-bold leading-none tabular-nums">{formatCompactCash(cash)}</p>

      <div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/15">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${TIER_GRADIENT[tier]} transition-[width] duration-500`}
            style={{ width: `${heat}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] opacity-70">Heat · {heatLabel(tier)}</p>
      </div>
    </div>
  );
}
