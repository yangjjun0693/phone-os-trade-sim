import { motion } from 'framer-motion';
import { Flame, Wallet } from 'lucide-react';
import { AnimatedNumber } from '@/components';
import { heatLabel, heatTier } from '@/game';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/utils/cn';
import { formatCompactCash } from '@/utils/format';
import { SPRING_SOFT } from '@/utils/motion';

const TIER_BAR: Record<ReturnType<typeof heatTier>, string> = {
  calm: 'from-emerald-400 to-green-500',
  watched: 'from-amber-300 to-orange-500',
  hot: 'from-orange-500 to-red-500',
  burned: 'from-red-500 to-rose-600',
};

const TIER_CHIP: Record<ReturnType<typeof heatTier>, string> = {
  calm: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  watched: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
  hot: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
  burned: 'bg-red-500/20 text-red-700 dark:text-red-300',
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
      className="glass relative flex min-h-[128px] flex-col justify-between gap-2 overflow-hidden rounded-[24px] p-3.5 text-ios-text shadow-[0_18px_40px_-26px_rgb(var(--ios-shadow)/0.6)] ring-1 ring-inset ring-white/50 dark:ring-white/10"
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -left-10 -top-12 size-32 rounded-full blur-2xl',
          alarming ? 'bg-orange-400/30 dark:bg-orange-500/20' : 'bg-emerald-400/25 dark:bg-emerald-500/15',
        )}
      />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-ios-muted">
          <Wallet className="size-3.5" aria-hidden />
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em]">현금</span>
        </div>
        <div
          className={cn(
            'flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums',
            TIER_CHIP[tier],
          )}
        >
          <motion.span
            animate={alarming ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={alarming ? { duration: 1.6, repeat: Infinity } : SPRING_SOFT}
            className="flex"
          >
            <Flame className="size-3" aria-hidden />
          </motion.span>
          {heat}
        </div>
      </div>

      <AnimatedNumber
        value={cash}
        format={formatCompactCash}
        className="relative text-[23px] font-bold leading-none tracking-tight"
      />

      <div className="relative">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ios-separator/15">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${TIER_BAR[tier]}`}
            initial={false}
            animate={{ width: `${heat > 0 ? Math.max(4, heat) : 0}%` }}
            transition={SPRING_SOFT}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10.5px] font-medium text-ios-muted">
          <span className="uppercase tracking-[0.12em]">Heat</span>
          <span>{heatLabel(tier)}</span>
        </div>
      </div>
    </motion.div>
  );
}
