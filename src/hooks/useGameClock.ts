import { useGameStore } from '@/store/gameStore';
import { formatClock, formatFullDate, formatShortDate } from '@/utils/format';

/** In-game wall clock, injected from the game store (never the real clock). */
export function useGameClock() {
  const iso = useGameStore((s) => s.gameDateTime);
  return {
    iso,
    time: formatClock(iso),
    date: formatFullDate(iso),
    short: formatShortDate(iso),
  };
}
