import { AnimatePresence } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { useOSStore } from '@/store/osStore';
import { AppSwitcher } from './AppSwitcher';
import { AppWindow } from './AppWindow';
import { ControlCenter } from './ControlCenter';
import { HomeIndicator } from './HomeIndicator';
import { HomeScreen } from './HomeScreen';
import { LockScreen } from './LockScreen';
import { NotificationCenter } from './NotificationCenter';
import { StatusBar } from './StatusBar';

/** Distance after which a bottom-edge swipe-up opens the app switcher. */
const SWITCHER_DRAG = 140;

/**
 * Root of the fake OS. Owns the layering (home → app → overlays → chrome) and
 * the system-wide edge gestures.
 *
 * Gesture map (documented assumption — iOS itself distinguishes by timing,
 * which we approximate with distance):
 *  - top-left edge, drag down  → notification centre
 *  - top-right edge, drag down → control centre
 *  - bottom edge, drag up      → close the open app, or (with a longer drag)
 *                                open the app switcher
 */
export function OSShell() {
  const locked = useOSStore((s) => s.locked);
  const openAppId = useOSStore((s) => s.openAppId);
  const overlay = useOSStore((s) => s.overlay);
  const recents = useOSStore((s) => s.recents);
  const brightness = useOSStore((s) => s.controls.brightness);
  const goHome = useOSStore((s) => s.goHome);
  const setOverlay = useOSStore((s) => s.setOverlay);

  const edgesEnabled = !locked && overlay === 'none';

  const bindTopLeft = useDrag(
    ({ last, tap, movement: [, my], velocity: [, vy] }) => {
      if (!last || tap) return;
      if (my > 40 || vy > 0.4) setOverlay('notification');
    },
    { axis: 'y', filterTaps: true, enabled: edgesEnabled, touchAction: 'none' },
  );

  const bindTopRight = useDrag(
    ({ last, tap, movement: [, my], velocity: [, vy] }) => {
      if (!last || tap) return;
      if (my > 40 || vy > 0.4) setOverlay('control');
    },
    { axis: 'y', filterTaps: true, enabled: edgesEnabled, touchAction: 'none' },
  );

  const bindBottom = useDrag(
    ({ last, tap, movement: [, my], direction: [, dy], velocity: [, vy] }) => {
      if (!last || tap) return;
      const swipedUp = my < -40 || (vy > 0.5 && dy < 0);
      if (!swipedUp) return;

      if (openAppId) {
        if (my < -SWITCHER_DRAG) setOverlay('appSwitcher');
        else goHome();
      } else if (recents.length > 0 && my < -120) {
        setOverlay('appSwitcher');
      }
    },
    { axis: 'y', filterTaps: true, enabled: edgesEnabled, touchAction: 'none' },
  );

  const dim = Math.min(0.6, Math.max(0, (1 - brightness) * 0.6));

  return (
    <div className="relative h-full w-full overflow-hidden bg-ios-bg">
      <HomeScreen />

      <AnimatePresence>
        {openAppId ? <AppWindow key={openAppId} appId={openAppId} /> : null}
      </AnimatePresence>

      {/* system gestures */}
      <div className="absolute left-0 top-0 z-40 h-12 w-[62%]" {...bindTopLeft()} />
      <div className="absolute right-0 top-0 z-40 h-12 w-[38%]" {...bindTopRight()} />
      <div className="absolute bottom-0 left-0 z-40 h-6 w-full" {...bindBottom()} />

      <AnimatePresence>
        {overlay === 'notification' ? <NotificationCenter key="notification" /> : null}
        {overlay === 'control' ? <ControlCenter key="control" /> : null}
        {overlay === 'appSwitcher' ? <AppSwitcher key="appSwitcher" /> : null}
      </AnimatePresence>

      <AnimatePresence>{locked ? <LockScreen key="lock" /> : null}</AnimatePresence>

      <StatusBar />
      <HomeIndicator />

      {/* brightness dimmer driven by the control centre */}
      <div
        className="pointer-events-none absolute inset-0 z-[60] bg-black"
        style={{ opacity: dim }}
        aria-hidden
      />
    </div>
  );
}
