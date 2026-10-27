import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, useIsPresent } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { useOSStore } from '@/store/osStore';
import { useTutorialStore } from '@/store/tutorialStore';
import { AppSwitcher } from './AppSwitcher';
import { AppWindow } from './AppWindow';
import { ControlCenter } from './ControlCenter';
import { GameStatusOverlay } from './GameStatusOverlay';
import { HomeIndicator } from './HomeIndicator';
import { HomeScreen } from './HomeScreen';
import { LockScreen } from './LockScreen';
import { NotificationCenter } from './NotificationCenter';
import { Onboarding } from './Onboarding';
import { StatusBar } from './StatusBar';
import { TutorialGuide } from './TutorialGuide';

/**
 * How far up from the bottom edge a swipe may start and still count as the
 * "go home" gesture. A tiny sliver is unusable on a real screen — the player
 * swipes up from the lower part of the display, not from the last few pixels,
 * and missing the strip used to strand them inside an app.
 */
const HOME_ZONE = 140;
/** Minimum upward travel before the gesture counts. */
const HOME_TRAVEL = 60;
/** A slower drag is a scroll, not a home gesture. */
const HOME_MAX_MS = 520;
/** A very long swipe opens the app switcher instead of just going home. */
const SWITCHER_TRAVEL = 240;

/**
 * Invisible wrapper that makes a system overlay inert as soon as it starts
 * animating out. Exiting overlays stay mounted for ~200 ms and, because Framer
 * renders outgoing children after incoming ones, would otherwise sit on top of
 * whatever replaced them and swallow taps.
 */
function OverlayFrame({ children }: { children: ReactNode }) {
  const isPresent = useIsPresent();
  return (
    <div
      className="contents"
      aria-hidden={!isPresent}
      style={isPresent ? undefined : { pointerEvents: 'none' }}
    >
      {children}
    </div>
  );
}

/**
 * Root of the fake OS. Owns the layering (home → app → overlays → chrome) and
 * the system-wide edge gestures.
 *
 * Gesture map (documented assumption — iOS itself distinguishes by timing,
 * which we approximate with distance):
 *  - top-left edge, drag down  → notification centre
 *  - top-right edge, drag down → control centre
 *  - lower screen, swipe up    → close the open app, or (a longer swipe) open
 *                                the app switcher, or close an open overlay
 *  - the home bar (bottom)     → always an escape hatch
 *
 * The home gesture is observed on `window` in the capture phase rather than on
 * an overlay strip, so it can never swallow taps or scrolling inside an app.
 * The app and overlay layers are also made `pointer-events: none` whenever they
 * are not the active layer, so a lingering exit animation can never sit on top
 * of the home screen and eat every tap.
 */
export function OSShell() {
  const locked = useOSStore((s) => s.locked);
  const openAppId = useOSStore((s) => s.openAppId);
  const appSession = useOSStore((s) => s.appSession);
  const overlay = useOSStore((s) => s.overlay);
  const recents = useOSStore((s) => s.recents);
  const brightness = useOSStore((s) => s.controls.brightness);
  const editing = useOSStore((s) => s.editing);
  const goHome = useOSStore((s) => s.goHome);
  const setOverlay = useOSStore((s) => s.setOverlay);
  const setupDone = useTutorialStore((s) => s.setupDone);
  const guideActive = useTutorialStore((s) => s.active);

  /** Edges drive overlays and the home gesture; only the lock screen disables them. */
  const edgesEnabled = !locked;

  // The listeners below live for the whole session, so read live state via a ref.
  const uiRef = useRef({ locked, openAppId, overlay, recents });
  uiRef.current = { locked, openAppId, overlay, recents };

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

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let startT = 0;
    let tracking = false;

    const reset = () => {
      tracking = false;
    };

    const onDown = (event: PointerEvent) => {
      const { locked: isLocked } = uiRef.current;
      tracking =
        !isLocked && event.clientY >= window.innerHeight - HOME_ZONE;
      startX = event.clientX;
      startY = event.clientY;
      startT = event.timeStamp;
    };

    const onUp = (event: PointerEvent) => {
      if (!tracking) return;
      const dy = event.clientY - startY;
      const dx = Math.abs(event.clientX - startX);
      const quick = event.timeStamp - startT <= HOME_MAX_MS;
      reset();

      // Upward, roughly vertical and not a slow scroll drag.
      if (dy > -HOME_TRAVEL || Math.abs(dy) < dx || !quick) return;

      const ui = uiRef.current;
      if (ui.overlay !== 'none') {
        setOverlay('none');
        return;
      }
      if (ui.openAppId) {
        if (dy <= -SWITCHER_TRAVEL) setOverlay('appSwitcher');
        else goHome();
        return;
      }
      // On the home screen an upward flick opens the app switcher (like iOS).
      if (ui.recents.length > 0) setOverlay('appSwitcher');
    };

    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('pointerup', onUp, true);
    window.addEventListener('pointercancel', reset, true);
    return () => {
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointerup', onUp, true);
      window.removeEventListener('pointercancel', reset, true);
    };
  }, [goHome, setOverlay]);

  const dim = Math.min(0.6, Math.max(0, (1 - brightness) * 0.6));

  return (
    <div className="relative h-full w-full overflow-hidden bg-ios-bg">
      <HomeScreen />

      {/* App layer. Disabled unless an app is actually the active layer, so an
          exiting window (or one hidden behind an overlay) can never eat taps. */}
      <div className={openAppId && overlay === 'none' ? undefined : 'pointer-events-none'}>
        <AnimatePresence>
          {openAppId ? <AppWindow key={appSession} appId={openAppId} /> : null}
        </AnimatePresence>
      </div>

      {/* system gestures (top edge only — the home gesture is observed on window) */}
      <div className="absolute left-0 top-0 z-40 h-12 w-[62%]" {...bindTopLeft()} />
      <div className="absolute right-0 top-0 z-40 h-12 w-[38%]" {...bindTopRight()} />

      {/* Overlays. Also disabled when none is active. */}
      <div className={overlay === 'none' ? 'pointer-events-none' : undefined}>
        <AnimatePresence>
          {overlay === 'notification' ? (
            <OverlayFrame key="notification">
              <NotificationCenter />
            </OverlayFrame>
          ) : null}
          {overlay === 'control' ? (
            <OverlayFrame key="control">
              <ControlCenter />
            </OverlayFrame>
          ) : null}
          {overlay === 'appSwitcher' ? (
            <OverlayFrame key="appSwitcher">
              <AppSwitcher />
            </OverlayFrame>
          ) : null}
        </AnimatePresence>
      </div>

      <div className={locked ? undefined : 'pointer-events-none'}>
        <AnimatePresence>
          {locked ? (
            <OverlayFrame key="lock">
              <LockScreen />
            </OverlayFrame>
          ) : null}
        </AnimatePresence>
      </div>

      <StatusBar />
      <HomeIndicator />

      {/* The play guide floats over the *home screen only*: it never covers an
          app's nav bar or the dock, and it is not a gate — the player can keep
          playing anywhere and the guide just watches the save. */}
      {setupDone && !locked && !openAppId && overlay === 'none' && !editing && guideActive ? (
        <TutorialGuide />
      ) : null}

      {/* brightness dimmer driven by the control centre */}
      <div
        className="pointer-events-none absolute inset-0 z-[60] bg-black transition-opacity duration-300 ease-ios"
        style={{ opacity: dim }}
        aria-hidden
      />

      {locked ? null : <GameStatusOverlay />}

      {/* First boot: greeting sequence + setup. Sits above the lock screen, so
          the device is configured before the player ever sees the home screen. */}
      <AnimatePresence>{setupDone ? null : <Onboarding key="onboarding" />}</AnimatePresence>
    </div>
  );
}
