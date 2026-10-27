import { AnimatePresence, motion } from 'framer-motion';
import { Clock3 } from 'lucide-react';
import { useGameClock } from '@/hooks/useGameClock';
import { EASE_IOS, SPRING_SOFT } from '@/utils/motion';

/** In-game clock widget. Reads the virtual clock from the game store. */
export function ClockWidget() {
  const { time, date } = useGameClock();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_SOFT}
      className="glass relative flex min-h-[128px] flex-col justify-between overflow-hidden rounded-[24px] p-3.5 text-ios-text shadow-[0_18px_40px_-26px_rgb(var(--ios-shadow)/0.6)] ring-1 ring-inset ring-white/50 dark:ring-white/10"
    >
      {/* one static, blurred accent — cheaper than an animated aurora */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full bg-sky-400/25 blur-2xl dark:bg-sky-500/15"
      />

      <div className="relative flex items-center gap-1.5 text-ios-muted">
        <Clock3 className="size-3.5" aria-hidden />
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em]">게임 시간</span>
      </div>

      <div className="relative">
        <div className="h-[36px] overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={time}
              initial={{ y: 22, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -22, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_IOS }}
              className="text-[34px] font-bold leading-none tracking-tight tabular-nums"
            >
              {time}
            </motion.p>
          </AnimatePresence>
        </div>
        <p className="mt-1 text-[11px] font-medium text-ios-muted">{date}</p>
      </div>
    </motion.div>
  );
}
