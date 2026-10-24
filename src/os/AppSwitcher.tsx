import { AnimatePresence, motion } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { getApp } from '@/apps/registry';
import { useOSStore } from '@/store/osStore';
import { haptic } from '@/utils/haptics';
import { SPRING_SNAPPY } from '@/utils/motion';
import type { AppMeta } from '@/types';

function AppCard({
  app,
  onOpen,
  onClose,
}: {
  app: AppMeta;
  onOpen: () => void;
  onClose: () => void;
}) {
  const Icon = app.icon;

  const bind = useDrag(
    ({ last, tap, movement: [, my], velocity: [, vy] }) => {
      if (!last) return;
      if (tap) {
        onOpen();
        return;
      }
      if (my < -90 || vy > 0.6) {
        haptic(14);
        onClose();
      }
    },
    { axis: 'y', filterTaps: true, touchAction: 'pan-x' },
  );

  return (
    <motion.div
      layout
      exit={{ opacity: 0, scale: 0.85 }}
      transition={SPRING_SNAPPY}
      className="w-[70%] shrink-0 snap-center"
    >
      <div {...bind()}>
        <div className="overflow-hidden rounded-[26px] bg-ios-surface shadow-2xl ring-1 ring-white/10">
          <div
            className="flex h-[92px] items-center gap-2.5 px-4 text-white"
            style={{
              background: `linear-gradient(150deg, ${app.gradient[0]}, ${app.gradient[1]})`,
            }}
          >
            <Icon className="size-6" aria-hidden />
            <span className="text-[15px] font-semibold">{app.name}</span>
          </div>
          <div className="flex h-[300px] flex-col items-center justify-center gap-2 bg-ios-bg px-6 text-center">
            <Icon className="size-7 text-ios-muted" aria-hidden />
            <p className="text-[13px] font-medium text-ios-text">{app.name}</p>
            <p className="text-[11px] text-ios-muted">미리보기는 다음 단계에서 붙습니다</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/** Recent-apps carousel. Swipe a card up to close that app. */
export function AppSwitcher() {
  const recents = useOSStore((s) => s.recents);
  const openApp = useOSStore((s) => s.openApp);
  const removeRecent = useOSStore((s) => s.removeRecent);
  const setOverlay = useOSStore((s) => s.setOverlay);

  const apps = recents
    .map(getApp)
    .filter((app): app is NonNullable<ReturnType<typeof getApp>> => Boolean(app));

  const bind = useDrag(
    ({ last, tap, movement: [, my], direction: [, dy], velocity: [, vy] }) => {
      if (!last || tap) return;
      if (my > 60 || (vy > 0.5 && dy > 0)) setOverlay('none');
    },
    { axis: 'y', filterTaps: true, touchAction: 'pan-x' },
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-[45]"
      style={{ background: 'rgba(0,0,0,0.55)' }}
    >
      <div className="flex h-full w-full flex-col" {...bind()}>
        <div className="flex flex-1 items-center">
          {apps.length === 0 ? (
            <p className="w-full text-center text-[13px] text-white/70">최근 앱이 없습니다</p>
          ) : (
            <div className="no-scrollbar flex w-full snap-x snap-mandatory gap-3 overflow-x-auto px-8">
              <AnimatePresence initial={false}>
                {apps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    onOpen={() => openApp(app.id)}
                    onClose={() => removeRecent(app.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
        <p className="pb-[max(env(safe-area-inset-bottom,0px),28px)] text-center text-[12px] text-white/70">
          카드를 쓸어올리면 앱이 종료됩니다 · 배경을 쓸어내리면 닫힙니다
        </p>
      </div>
    </motion.div>
  );
}
