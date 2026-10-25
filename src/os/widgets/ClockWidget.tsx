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
      className="glass relative flex flex-col justify-between overflow-hidden rounded-[22px] p-3.5 text-ios-text shadow-lg ring-1 ring-inset ring-white/15"
    >
      <div className="relative flex items-center gap-1.5 opacity-70">
        <Clock3 className="size-3.5" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wide">게임 시간</span>
      </div>
      <div className="relative">
        <div className="h-[34px] overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={time}
              initial={{ y: 22, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -22, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_IOS }}
              className="text-[34px] font-bold leading-none tabular-nums"
            >
              {time}
            </motion.p>
          </AnimatePresence>
        </div>
        <p className="mt-1 text-[11px] opacity-70">{date}</p>
      </div>
    </motion.div>
  );
}
