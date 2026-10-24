import { motion } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { BellOff, X } from 'lucide-react';
import { getApp } from '@/apps/registry';
import { useGameClock } from '@/hooks/useGameClock';
import { useOSStore } from '@/store/osStore';
import { SPRING_SOFT } from '@/utils/motion';

/** Pull-down shade: game clock plus the notification feed. */
export function NotificationCenter() {
  const notifications = useOSStore((s) => s.notifications);
  const clearNotifications = useOSStore((s) => s.clearNotifications);
  const setOverlay = useOSStore((s) => s.setOverlay);

  const { time, date } = useGameClock();

  const bind = useDrag(
    ({ last, tap, movement: [, my], direction: [, dy], velocity: [, vy] }) => {
      if (!last || tap) return;
      if (my < -40 || (vy > 0.4 && dy < 0)) setOverlay('none');
    },
    { axis: 'y', filterTaps: true, touchAction: 'none' },
  );

  return (
    <motion.div
      initial={{ y: '-100%' }}
      animate={{ y: 0 }}
      exit={{ y: '-100%' }}
      transition={SPRING_SOFT}
      className="absolute inset-0 z-[45]"
      style={{ background: 'var(--os-wallpaper)' }}
    >
      <div className="glass-strong flex h-full w-full flex-col overflow-hidden" {...bind()}>
        <div className="flex items-start justify-between px-6 pt-[calc(var(--ios-statusbar-h)+10px)]">
          <div className="text-ios-text">
            <p className="text-[13px] font-medium opacity-70">{date}</p>
            <p className="text-[52px] font-bold leading-none tabular-nums">{time}</p>
          </div>
          <button
            type="button"
            aria-label="알림 모두 지우기"
            onClick={clearNotifications}
            className="mt-2 flex size-8 items-center justify-center rounded-full bg-black/10 text-ios-text"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="scroll-area no-scrollbar mt-5 flex-1 px-4 pb-10">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 pt-16 text-ios-muted">
              <BellOff className="size-6" aria-hidden />
              <p className="text-[14px]">알림이 없습니다</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className="glass-strong flex items-start gap-2.5 rounded-2xl p-3 text-ios-text shadow-lg ring-1 ring-inset ring-white/15"
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-white/20 text-[11px]">
                    {getApp(item.appId)?.name.slice(0, 1) ?? '!'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold">{item.title}</p>
                    <p className="mt-0.5 text-[13px] opacity-80">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
