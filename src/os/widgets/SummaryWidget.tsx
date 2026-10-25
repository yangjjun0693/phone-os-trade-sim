import { motion } from 'framer-motion';
import { Flame, Wallet } from 'lucide-react';
import { AnimatedNumber } from '@/components';
import { heatLabel, heatTier } from '@/game';
import { useGameStore } from '@/store/gameStore';
import { formatCompactCash } from '@/utils/format';
import { SPRING_SOFT } from '@/utils/motion';

const TIER_GRADIENT: Record<ReturnType<typeof heatTier>, string> = {
  calm: 'from-emerald-400 to-green-500',
  watched: 'from-amber-300 to-orange-500',
  hot: 'from-orange-500 to-red-500',
  burned: 'from-red-500 to-rose-600',
};

/** Cash + heat summary widget, driven by the live run state. */
export function SummaryWidget() {
  const cash = useGameStore((s) => s.cash);
  const heat = useGameStore((s) => s.heat);
  const tier = heatTier(heat);
  const alarming = tier === 'hot' || tier === 'burned';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_SOFT, delay: 0.05 }}
      className="glass relative flex flex-col justify-between gap-2 overflow-hidden rounded-[22px] p-3.5 text-ios-text shadow-lg ring-1 ring-inset ring-white/15"
    >
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-1.5 opacity-70">
          <Wallet className="size-3.5" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-wide">현금</span>
        </div>
        <div className="flex items-center gap-1 opacity-70">
          <motion.span
            animate={alarming ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={alarming ? { duration: 1.4, repeat: Infinity } : SPRING_SOFT}
            className="flex"
          >
            <Flame className="size-3.5" aria-hidden />
          </motion.span>
          <span className="text-[11px] font-semibold tabular-nums">{heat}</span>
        </div>
      </div>

      <AnimatedNumber
        value={cash}
        format={formatCompactCash}
        className="relative text-[22px] font-bold leading-none"
      />

      <div className="relative">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/15">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${TIER_GRADIENT[tier]}`}
            initial={false}
            animate={{ width: `${heat}%` }}
            transition={SPRING_SOFT}
          />
        </div>
        <p className="mt-1 text-[11px] opacity-70">Heat · {heatLabel(tier)}</p>
      </div>
    </motion.div>
  );
}
