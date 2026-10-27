import { AnimatePresence, motion } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { getApp } from '@/apps/registry';
import { useOSStore } from '@/store/osStore';
import { haptic } from '@/utils/haptics';
import { SPRING_SNAPPY } from '@/utils/motion';
import type { AppMeta } from '@/types';

function AppCard({
  app,
  index,
  onOpen,
  onClose,
}: {
  app: AppMeta;
  index: number;
  onOpen: () => void;
  onClose: () => void;
}) {
  const Icon = app.icon;

  const bind = useDrag(
    ({ last, tap, movement: [, my], velocity: [, vy] }) => {
      if (!last || tap) return;
      // Swipe a card up to quit that app.
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
      initial={{ opacity: 0, y: 26, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ ...SPRING_SNAPPY, delay: Math.min(index, 5) * 0.05 }}
      className="w-[70%] shrink-0 snap-center"
    >
      <div {...bind()}>
        {/*
          A real button, not a gesture. The gesture library's tap flag turned out
          to be unreliable here, so tapping a card did nothing — which stranded
          the player in the switcher with every tap ignored.
        */}
        <button
          type="button"
          onClick={onOpen}
          aria-label={`${app.name} 열기`}
          className="block w-full overflow-hidden rounded-[26px] bg-ios-surface text-left shadow-2xl ring-1 ring-white/10 active:opacity-90"
        >
          <span
            className="relative flex h-[92px] items-center gap-2.5 overflow-hidden px-4 text-white"
            style={{
              background: `linear-gradient(150deg, ${app.gradient[0]}, ${app.gradient[1]})`,
            }}
          >
            <Icon className="size-6" aria-hidden />
            <span className="text-[15px] font-semibold">{app.name}</span>
          </span>
          <span className="flex h-[300px] flex-col items-center justify-center gap-2 bg-ios-bg px-6 text-center">
            <Icon className="size-7 text-ios-muted" aria-hidden />
            <span className="text-[13px] font-medium text-ios-text">{app.name}</span>
            <span className="text-[11px] text-ios-muted">미리보기는 다음 단계에서 붙습니다</span>
          </span>
        </button>
      </div>
    </motion.div>
  );
}

/** Recent-apps carousel. Tap a card to reopen, swipe it up to quit that app. */
export function AppSwitcher() {
  const recents = useOSStore((s) => s.recents);
  const openAppId = useOSStore((s) => s.openAppId);
  const openApp = useOSStore((s) => s.openApp);
  const closeApp = useOSStore((s) => s.closeApp);
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
      <div className="relative flex h-full w-full flex-col" {...bind()}>
        {/* Real close button behind the cards: tapping empty space always dismisses. */}
        <button
          type="button"
          aria-label="앱 전환기 닫기"
          onClick={() => setOverlay('none')}
          className="absolute inset-0 z-0"
        />
        {/*
          Everything below is interactive only while the switcher is the active
          overlay: the OSShell wrapper sets pointer-events: none when it is not,
          and nothing in here overrides that (an override used to leave
          invisible cards eating every tap on the screen below).
        */}
        <div
          className="relative z-10 flex flex-1 items-center"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOverlay('none');
          }}
        >
          {apps.length === 0 ? (
            <p className="w-full text-center text-[13px] text-white/70">최근 앱이 없습니다</p>
          ) : (
            <div className="no-scrollbar flex w-full snap-x snap-mandatory gap-3 overflow-x-auto px-8">
              <AnimatePresence initial={false}>
                {apps.map((app, index) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    index={index}
                    onOpen={() => openApp(app.id)}
                    onClose={() => {
                      // Quitting a card also quits the app if it is the running
                      // one (the app now stays mounted behind the switcher).
                      if (openAppId === app.id) closeApp();
                      removeRecent(app.id);
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
        <p className="pointer-events-none relative z-10 pb-[max(env(safe-area-inset-bottom,0px),28px)] text-center text-[12px] text-white/70">
          카드를 쓸어올리면 앱이 종료됩니다 · 배경을 쓸어내리면 닫힙니다
        </p>
      </div>
    </motion.div>
  );
}
