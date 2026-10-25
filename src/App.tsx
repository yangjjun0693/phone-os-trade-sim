import { useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { MINUTES_PER_TICK, tickMs } from '@/content/time';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { OSShell } from '@/os/OSShell';
import { PhoneFrame } from '@/os/PhoneFrame';
import { useGameStore } from '@/store/gameStore';
import { useOSStore } from '@/store/osStore';

/**
 * The in-game clock. Each tick advances the clock by `MINUTES_PER_TICK` in-game
 * minutes; how long a tick lasts in real time comes from `src/content/time.ts`
 * (default: 하루 ≈ 실시간 15분, 5분 단위 진행).
 * It lives here (not in the store) so the store stays a pure data container.
 */
export function App() {
  useResolvedTheme();
  const clockSpeed = useOSStore((s) => s.clockSpeed);

  useEffect(() => {
    const id = window.setInterval(() => {
      const store = useGameStore.getState();
      store.advanceGameTime(MINUTES_PER_TICK);
      // The clock drives everything that happens over time.
      store.tickMessenger();
      store.tickShipments();
    }, tickMs(clockSpeed));
    return () => window.clearInterval(id);
  }, [clockSpeed]);

  return (
    // `reducedMotion="user"` makes every Framer animation honour the OS
    // setting: transforms are dropped, opacity fades are kept.
    <MotionConfig reducedMotion="user">
      <PhoneFrame>
        <OSShell />
      </PhoneFrame>
    </MotionConfig>
  );
}
