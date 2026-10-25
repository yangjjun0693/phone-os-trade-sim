import { AnimatePresence, motion } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { Camera, Flashlight, Lock } from 'lucide-react';
import { getApp } from '@/apps/registry';
import { useGameClock } from '@/hooks/useGameClock';
import { useOSStore } from '@/store/osStore';
import { haptic } from '@/utils/haptics';
import { EASE_IOS, SPRING_BOUNCY, SPRING_SOFT } from '@/utils/motion';

/** Round glass shortcut at the bottom of the lock screen (cosmetic for now). */
function CornerButton({ label, icon: Icon }: { label: string; icon: typeof Camera }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      whileTap={{ scale: 0.86 }}
      transition={SPRING_BOUNCY}
      className="glass-strong flex size-[46px] items-center justify-center rounded-full text-ios-text shadow-lg ring-1 ring-inset ring-white/15"
    >
      <Icon className="size-5" aria-hidden />
    </motion.button>
  );
}

/**
 * Lock screen. Swipe up (or use the labelled button) to unlock.
 * The gesture sits on an inner plain element so Framer Motion owns the
 * enter/exit animation of the outer wrapper.
 */
export function LockScreen() {
  const unlock = useOSStore((s) => s.unlock);
  const notifications = useOSStore((s) => s.notifications);
  const openApp = useOSStore((s) => s.openApp);
  const { time, date } = useGameClock();

  const bind = useDrag(
    ({ last, tap, movement: [, my], direction: [, dy], velocity: [, vy] }) => {
      if (!last || tap) return;
      // A swipe up (or a fast flick) unlocks.
      if (my < -70 || (vy > 0.5 && dy < 0)) {
        haptic(12);
        unlock();
      }
    },
    { axis: 'y', filterTaps: true, touchAction: 'none' },
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ y: '-100%', opacity: 0.4 }}
      transition={{ duration: 0.3, ease: EASE_IOS }}
      className="absolute inset-0 z-[45]"
      style={{ background: 'var(--os-wallpaper)' }}
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden" {...bind()}>
        <div className="flex flex-1 flex-col px-6 pt-[calc(var(--ios-statusbar-h)+18px)]">
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING_SOFT}
            className="flex flex-col items-center text-white mix-blend-difference"
          >
            <p className="text-[15px] font-medium">{date}</p>
            <div className="relative mt-1 h-[76px] w-full overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={time}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -30, opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE_IOS }}
                  className="absolute inset-x-0 text-center text-[76px] font-bold leading-none tracking-tight tabular-nums"
                >
                  {time}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_SOFT, delay: 0.05 }}
            className="mt-8 flex flex-col gap-2 overflow-hidden"
          >
            {notifications.slice(0, 4).map((item, index) => (
              <motion.button
                key={item.id}
                type="button"
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...SPRING_SOFT, delay: 0.08 + index * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (item.appId) {
                    unlock();
                    openApp(item.appId);
                  }
                }}
                className="glass-strong flex items-start gap-2.5 rounded-2xl p-3 text-left text-ios-text shadow-lg ring-1 ring-inset ring-white/15"
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-white/20 text-[11px]">
                  {getApp(item.appId)?.name.slice(0, 1) ?? '!'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold">{item.title}</span>
                  <span className="mt-0.5 block truncate text-[13px] opacity-80">{item.body}</span>
                </span>
              </motion.button>
            ))}
          </motion.div>
        </div>

        <div className="shrink-0 px-6 pb-[calc(env(safe-area-inset-bottom,0px)+22px)]">
          <div className="flex items-center justify-between">
            <CornerButton label="손전등" icon={Flashlight} />
            <CornerButton label="카메라" icon={Camera} />
          </div>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => {
              haptic(12);
              unlock();
            }}
            className="mx-auto mt-5 flex items-center gap-1.5 text-[13px] font-medium text-white/80 mix-blend-difference"
          >
            <Lock className="size-3.5" aria-hidden />
            위로 밀어 잠금 해제
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
