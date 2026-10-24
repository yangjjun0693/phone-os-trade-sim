import { Clock3 } from 'lucide-react';
import { useGameClock } from '@/hooks/useGameClock';

/** In-game clock widget. Reads the virtual clock from the game store. */
export function ClockWidget() {
  const { time, date } = useGameClock();

  return (
    <div className="glass flex flex-col justify-between rounded-[22px] p-3.5 text-ios-text shadow-lg ring-1 ring-inset ring-white/15">
      <div className="flex items-center gap-1.5 opacity-70">
        <Clock3 className="size-3.5" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wide">게임 시간</span>
      </div>
      <div>
        <p className="mt-2 text-[34px] font-bold leading-none tabular-nums">{time}</p>
        <p className="mt-1 text-[11px] opacity-70">{date}</p>
      </div>
    </div>
  );
}
