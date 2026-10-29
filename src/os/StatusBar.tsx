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
          'relative flex h-[11.5px] w-[23px] items-center rounded-[3.5px] border p-[1.5px]',
          charging && 'border-ios-green/60',
        )}
        style={
          charging
            ? undefined
            : { borderColor: 'color-mix(in srgb, currentColor 35%, transparent)' }
        }
      >
        <motion.span
          animate={{ width: `${pct}%` }}
          transition={SPRING_SNAPPY}
          className={cn('h-full rounded-[2px] bg-current', charging && 'bg-ios-green')}
        />
      </span>
      <span className="h-[4px] w-[1.5px] rounded-r-sm bg-current opacity-40" />
    </span>
  );
}

/**
 * Persistent status bar. Rendered once by the shell and always visible, so app
 * content only needs top padding, never its own copy.
 *
 * The glyphs use the wallpaper chrome token: near-black ink on the light
 * wallpaper, white on the dark one. A real colour token beats
 * `mix-blend-difference`, which produced muddy, unreadable chrome over the
 * pastel light wallpaper.
 */
export function StatusBar({
  /** Sit above a pull-down overlay so the clock/battery stay visible. */
  elevated = false,
  /** White chrome, for the always-dark app switcher. */
  inverted = false,
}: {
  elevated?: boolean;
  inverted?: boolean;
} = {}) {
  const { time } = useGameClock();
  const status = useOSStore((s) => s.status);
  const airplane = useOSStore((s) => s.controls.airplane);
  const setOverlay = useOSStore((s) => s.setOverlay);

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 h-[var(--ios-statusbar-h)]',
        elevated ? 'z-[46]' : 'z-40',
      )}
    >
      <DynamicIsland
        onClick={() => setOverlay('notification')}
        className="absolute left-1/2 top-[var(--ios-island-top)] z-10 -translate-x-1/2"
      />

      <div
        data-status-ink
        className={cn(
          'flex h-full items-center justify-between px-7',
          inverted ? 'text-white' : 'wallpaper-ink',
        )}
      >
        <span className="min-w-14 text-[15px] font-semibold tracking-tight tabular-nums">
          {time}
        </span>
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
