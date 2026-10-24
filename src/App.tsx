import { useEffect } from 'react';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { OSShell } from '@/os/OSShell';
import { PhoneFrame } from '@/os/PhoneFrame';
import { useGameStore } from '@/store/gameStore';

/**
 * The in-game clock advances one in-game minute every 30 real seconds. It lives
 * here (not in the store) so the store stays a pure data container.
 */
const GAME_CLOCK_INTERVAL_MS = 30_000;

export function App() {
  useResolvedTheme();

  useEffect(() => {
    const id = window.setInterval(() => {
      useGameStore.getState().advanceGameTime(1);
    }, GAME_CLOCK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <PhoneFrame>
      <OSShell />
    </PhoneFrame>
  );
}
