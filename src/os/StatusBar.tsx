import { AnimatePresence, motion } from 'framer-motion';
import { Wifi } from 'lucide-react';
import { useGameClock } from '@/hooks/useGameClock';
import { useOSStore } from '@/store/osStore';
import { cn } from '@/utils/cn';
import { SPRING_SNAPPY } from '@/utils/motion';
import { DynamicIsland } from './DynamicIsland';

function SignalBars({ level }: { level: number }) {
  return (
    <span className="flex items-end gap-[2px]" aria-hidden>
      {[0, 1, 2, 3].map((index) => (
        <motion.span
          key={index}
          animate={{
            height: 5 + index * 2.5,
            opacity: index < level ? 1 : 0.25,
          }}
          transition={SPRING_SNAPPY}
          className="w-[3px] rounded-[1px] bg-current"
        />
      ))}
    </span>
  );
}

function BatteryIcon({ level, charging }: { level: number; charging: boolean }) {
  const pct = Math.min(100, Math.max(0, level));
  return (
    <span className="flex items-center gap-[1.5px]" aria-hidden>
      <span
        className={cn(
          'relative flex h-[11.5px] w-[23px] items-center rounded-[3.5px] border border-current/35 p-[1.5px]',
          charging && 'border-ios-green/60',
        )}
      >
        <motion.span
          animate={{ width: `${pct}%` }}
          transition={SPRING_SNAPPY}
          className={cn('h-full rounded-[2px] bg-current', charging && 'bg-ios-green')}
        />
      </span>
      <span className="h-[4px] w-[1.5px] rounded-r-sm bg-current/35" />
    </span>
  );
}

/**
 * Persistent status bar. Rendered once by the shell and always visible, so app
 * content only needs top padding, never its own copy.
 *
 * `mix-blend-difference` keeps the glyphs legible on any wallpaper without
 * having to know the screen's brightness.
 */
export function StatusBar() {
  const { time } = useGameClock();
  const status = useOSStore((s) => s.status);
  const airplane = useOSStore((s) => s.controls.airplane);
  const setOverlay = useOSStore((s) => s.setOverlay);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[var(--ios-statusbar-h)]">
      <DynamicIsland
        onClick={() => setOverlay('notification')}
        className="absolute left-1/2 top-[var(--ios-island-top)] z-10 -translate-x-1/2"
      />

      <div className="flex h-full items-center justify-between px-7 text-white mix-blend-difference">
        <span className="min-w-14 text-[15px] font-semibold tabular-nums">{time}</span>
        <span className="flex items-center gap-1.5">
          {airplane ? (
            <span className="text-[11px] font-semibold">✈</span>
          ) : (
            <SignalBars level={status.signal} />
          )}
          <AnimatePresence initial={false}>
            {status.wifi && !airplane ? (
              <motion.span
                key="wifi"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={SPRING_SNAPPY}
              >
                <Wifi className="size-[15px]" strokeWidth={2.6} aria-hidden />
              </motion.span>
            ) : null}
          </AnimatePresence>
          <BatteryIcon level={status.battery} charging={status.charging} />
        </span>
      </div>
    </div>
  );
}
