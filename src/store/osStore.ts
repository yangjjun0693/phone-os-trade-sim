import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  GameNotification,
  HomeLayout,
  OverlayKind,
  PhoneStatus,
  ThemeMode,
} from '@/types';
import { DEFAULT_CLOCK_SPEED, type ClockSpeed } from '@/content/time';
import {
  eventGroupKey,
  isExpired,
  notificationsForEvent,
  shouldDeliver,
  type GameEvent,
} from '@/game/notifications';
import { useGameStore } from './gameStore';
import { useTutorialStore } from './tutorialStore';
import { DEFAULT_LAYOUT, OS_PERSIST_VERSION, withMissingDefaultApps } from './defaults';

const RECENTS_LIMIT = 8;
/** How many notifications the shade keeps before the oldest roll off. */
const NOTIFICATION_LIMIT = 20;

/** Spam-guard bookkeeping carried across reloads. */
export interface NotificationMeta {
  /** In-game day the counters below belong to. */
  day: number;
  /** Notifications delivered today, reset lazily when the day rolls over. */
  todayCount: number;
  /** Group key -> ISO game time of the last delivery, for the cooldown. */
  lastByKey: Record<string, string>;
}

export function defaultNotificationMeta(): NotificationMeta {
  return { day: 1, todayCount: 0, lastByKey: {} };
}

export interface OSControls {
  brightness: number;
  volume: number;
  airplane: boolean;
  bluetooth: boolean;
  flashlight: boolean;
}

export interface OSState {
  /** Lock screen visible? */
  locked: boolean;
  theme: ThemeMode;
  /** How fast in-game time runs (see src/content/time.ts). */
  clockSpeed: ClockSpeed;
  status: PhoneStatus;
  controls: OSControls;
  layout: HomeLayout;
  /** Home-screen icon edit (jiggle) mode. */
  editing: boolean;
  /** Currently open app, or null when the home screen is showing. */
  openAppId: string | null;
  /**
   * Incremented on every `openApp`. Used as the window's React key so that
   * reopening an app can never collide with a window that is still animating
   * out (a duplicate key made Framer reuse the exiting node, which could leave
   * an invisible, tap-eating window behind).
   */
  appSession: number;
  recents: string[];
  overlay: OverlayKind;
  /** The notification shade's contents, newest first. Persisted. */
  notifications: GameNotification[];
  /** Spam-guard bookkeeping: which day we are on, today's tally, last send per group. */
  notificationMeta: NotificationMeta;
  /** Id of the notification currently raised as a transient pill (never persisted). */
  pillId: string | null;
  /** Bumped whenever a fresh pill is raised, so the pill can re-animate (never persisted). */
  pillSeq: number;

  lock: () => void;
  unlock: () => void;
  toggleLock: () => void;
  setTheme: (theme: ThemeMode) => void;
  setClockSpeed: (speed: ClockSpeed) => void;
  setStatus: (patch: Partial<PhoneStatus>) => void;
  setControl: <K extends keyof OSControls>(key: K, value: OSControls[K]) => void;
  setLayout: (layout: HomeLayout) => void;
  moveApp: (activeId: string, overId: string) => void;
  resetLayout: () => void;
  setEditing: (editing: boolean) => void;
  openApp: (appId: string) => void;
  closeApp: () => void;
  goHome: () => void;
  removeRecent: (appId: string) => void;
  setOverlay: (overlay: OverlayKind) => void;
  /**
   * Turn a domain event into notifications and store whichever survive the
   * spam guard. Returns the ones actually delivered so the caller can fire
   * haptics / sound.
   */
  notify: (event: GameEvent) => GameNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  removeNotification: (id: string) => void;
  /** Legacy direct push. Returns the stored notification, or null when consent is off. */
  pushNotification: (notification: GameNotification) => GameNotification | null;
  clearNotifications: () => void;
  /**
   * Drop notifications already past their `expiresAt` as of `now`. Runs on the
   * game clock so the shade, lock screen and app badges all read the same
   * active set instead of each filtering on its own.
   */
  pruneExpired: (now: string) => void;
  /** Reset every notification field. Called when a run restarts. */
  clearNotificationState: () => void;
}

type ContainerRef = { kind: 'page'; page: number; index: number } | { kind: 'dock'; index: number };

function locate(layout: HomeLayout, id: string): ContainerRef | null {
  for (let page = 0; page < layout.pages.length; page += 1) {
    const index = layout.pages[page].indexOf(id);
    if (index !== -1) return { kind: 'page', page, index };
  }
  const dockIndex = layout.dock.indexOf(id);
  if (dockIndex !== -1) return { kind: 'dock', index: dockIndex };
  return null;
}

/** `overId` may be an app id or a container id (`page:0`, `dock`). */
function resolveTarget(layout: HomeLayout, overId: string): ContainerRef | null {
  if (overId.startsWith('page:')) {
    const page = Number(overId.slice('page:'.length));
    if (Number.isNaN(page)) return null;
    return { kind: 'page', page, index: layout.pages[page]?.length ?? 0 };
  }
  if (overId === 'dock') {
    return { kind: 'dock', index: layout.dock.length };
  }
  return locate(layout, overId);
}

function removeAt(layout: HomeLayout, ref: ContainerRef): void {
  if (ref.kind === 'page') layout.pages[ref.page].splice(ref.index, 1);
  else layout.dock.splice(ref.index, 1);
}

function insertAt(layout: HomeLayout, ref: ContainerRef, id: string): void {
  if (ref.kind === 'page') {
    const page = layout.pages[ref.page] ?? (layout.pages[ref.page] = []);
    page.splice(Math.min(ref.index, page.length), 0, id);
  } else {
    layout.dock.splice(Math.min(ref.index, layout.dock.length), 0, id);
  }
}

type PersistedOS = Pick<
  OSState,
  | 'theme'
  | 'clockSpeed'
  | 'status'
  | 'controls'
  | 'layout'
  | 'recents'
  | 'notifications'
  | 'notificationMeta'
>;

/**
 * Add the notification fields a pre-v12 save lacks, without disturbing what it
 * already has. Applied on every migration path so v11 and older all land here.
 */
function withNotificationFields(previous: Partial<PersistedOS>): Partial<PersistedOS> {
  return {
    ...previous,
    notifications: previous.notifications ?? [],
    notificationMeta: previous.notificationMeta ?? defaultNotificationMeta(),
  };
}

/**
 * Persist migration. Exported so the version bump can be tested directly
 * (the persisted state shape is otherwise awkward to reach).
 */
export const migrateOS = (persisted: unknown, version: number): PersistedOS => {
  const previous = (persisted ?? {}) as Partial<PersistedOS>;
  if (version < 1) {
    return withNotificationFields({ ...previous, layout: DEFAULT_LAYOUT }) as PersistedOS;
  }
  if (version < 7) {
    return withNotificationFields({ ...previous, layout: DEFAULT_LAYOUT }) as PersistedOS;
  }
  if (version < 8) {
    return withNotificationFields({ ...previous, clockSpeed: DEFAULT_CLOCK_SPEED }) as PersistedOS;
  }
  // v9: the home screen became a single page holding every app.
  if (version < 9) {
    return withNotificationFields({
      ...previous,
      clockSpeed: previous.clockSpeed ?? DEFAULT_CLOCK_SPEED,
      layout: DEFAULT_LAYOUT,
    }) as PersistedOS;
  }
  // v10: the old default brightness (0.72) greyed out every screen.
  // Only bump saves that still carry that exact default.
  if (version < 10) {
    const controls = previous.controls ?? {
      brightness: 1,
      volume: 0.45,
      airplane: false,
      bluetooth: true,
      flashlight: false,
    };
    return withNotificationFields({
      ...previous,
      controls: {
        ...controls,
        brightness: controls.brightness === 0.72 ? 1 : controls.brightness,
      },
    }) as PersistedOS;
  }
  // v11: a new app (Amason) joined the home screen. Append whatever the
  // default layout has and this save does not, so nobody has to hunt for
  // it — and leave the order the player arranged untouched.
  if (version < 11) {
    return withNotificationFields({
      ...previous,
      layout: withMissingDefaultApps(previous.layout),
    }) as PersistedOS;
  }
  // v12: notifications moved into the save, along with the spam-guard meta.
  return withNotificationFields(previous) as PersistedOS;
};

export const useOSStore = create<OSState>()(
  persist(
    immer((set) => ({
      locked: true,
      theme: 'system',
      clockSpeed: DEFAULT_CLOCK_SPEED,
      status: { battery: 82, charging: false, signal: 4, wifi: true },
      controls: {
        // Full brightness by default: the dimmer is a player-controlled effect,
        // not a permanent grey wash over the whole OS.
        brightness: 1,
        volume: 0.45,
        airplane: false,
        bluetooth: true,
        flashlight: false,
      },
      layout: DEFAULT_LAYOUT,
      editing: false,
      openAppId: null,
      appSession: 0,
      recents: [],
      overlay: 'none',
      notifications: [],
      notificationMeta: defaultNotificationMeta(),
      pillId: null,
      pillSeq: 0,

      lock: () =>
        set((s) => {
          s.locked = true;
          s.overlay = 'none';
        }),
      unlock: () =>
        set((s) => {
          s.locked = false;
        }),
      toggleLock: () =>
        set((s) => {
          s.locked = !s.locked;
        }),
      setTheme: (theme) =>
        set((s) => {
          s.theme = theme;
        }),
      setClockSpeed: (speed) =>
        set((s) => {
          s.clockSpeed = speed;
        }),
      setStatus: (patch) =>
        set((s) => {
          Object.assign(s.status, patch);
        }),
      setControl: (key, value) =>
        set((s) => {
          s.controls[key] = value;
          if (key === 'airplane' && value) s.status.wifi = false;
        }),
      setLayout: (layout) =>
        set((s) => {
          s.layout = layout;
        }),
      moveApp: (activeId, overId) =>
        set((s) => {
          if (activeId === overId) return;
          const from = locate(s.layout, activeId);
          const to = resolveTarget(s.layout, overId);
          if (!from || !to) return;

          const sameContainer =
            (from.kind === 'page' && to.kind === 'page' && from.page === to.page) ||
            (from.kind === 'dock' && to.kind === 'dock');

          removeAt(s.layout, from);

          const index = sameContainer && to.index > from.index ? to.index - 1 : to.index;
          insertAt(s.layout, { ...to, index }, activeId);
        }),
      resetLayout: () =>
        set((s) => {
          s.layout = { pages: DEFAULT_LAYOUT.pages.map((p) => [...p]), dock: [...DEFAULT_LAYOUT.dock] };
        }),
      setEditing: (editing) =>
        set((s) => {
          s.editing = editing;
        }),
      openApp: (appId) => {
        // Tell the guide an app was visited. Steps keyed on "open this app"
        // are detected from this list, so the guide never has to wrap the app.
        useTutorialStore.getState().noteOpenedApp(appId);
        set((s) => {
          s.openAppId = appId;
          s.appSession += 1;
          s.overlay = 'none';
          s.editing = false;
          s.recents = [appId, ...s.recents.filter((id) => id !== appId)].slice(0, RECENTS_LIMIT);
        });
      },
      closeApp: () =>
        set((s) => {
          s.openAppId = null;
        }),
      goHome: () =>
        set((s) => {
          s.openAppId = null;
          s.overlay = 'none';
          s.editing = false;
        }),
      removeRecent: (appId) =>
        set((s) => {
          s.recents = s.recents.filter((id) => id !== appId);
        }),
      setOverlay: (overlay) =>
        set((s) => {
          s.overlay = overlay;
          // NOTE: deliberately keeps `openAppId`. Like iOS, notification /
          // control centre and the app switcher are layers *over* the running
          // app: dismissing them returns you to it. Closing the app here used to
          // unmount the window mid-gesture, and reopening the same app from the
          // switcher then raced its exit animation — which could leave an
          // invisible, unresponsive window on top of the new one.
        }),
      notify: (event) => {
        const { gameDateTime: now, day } = useGameStore.getState();
        const built = notificationsForEvent(event);
        const delivered: GameNotification[] = [];
        set((s) => {
          // Roll the daily counter lazily, even while alerts are switched off:
          // the tally has to be correct the moment they are switched back on.
          if (s.notificationMeta.day !== day) {
            s.notificationMeta.day = day;
            s.notificationMeta.todayCount = 0;
          }
          // Consent is a real preference — apps still work, but nothing lands.
          if (!useTutorialStore.getState().notifications) return;
          for (const notif of built) {
            const allowed = shouldDeliver({
              notification: notif,
              existing: s.notifications,
              now,
              lastByKey: s.notificationMeta.lastByKey,
              todayCount: s.notificationMeta.todayCount,
            });
            if (!allowed) continue;
            s.notifications = [notif, ...s.notifications].slice(0, NOTIFICATION_LIMIT);
            s.notificationMeta.todayCount += 1;
            s.notificationMeta.lastByKey[eventGroupKey(event)] = now;
            delivered.push(notif);
            if (notif.priority === 'high' || notif.priority === 'urgent') {
              s.pillId = notif.id;
              s.pillSeq += 1;
            }
          }
        });
        return delivered;
      },
      markNotificationRead: (id) =>
        set((s) => {
          const notif = s.notifications.find((entry) => entry.id === id);
          if (notif) notif.read = true;
        }),
      markAllNotificationsRead: () =>
        set((s) => {
          for (const notif of s.notifications) notif.read = true;
        }),
      removeNotification: (id) =>
        set((s) => {
          s.notifications = s.notifications.filter((entry) => entry.id !== id);
        }),
      pushNotification: (notification) => {
        // Normalise the optional-at-runtime fields legacy callers omit.
        const stored: GameNotification = {
          ...notification,
          priority: notification.priority ?? 'normal',
          createdAt: notification.createdAt ?? useGameStore.getState().gameDateTime,
          read: notification.read ?? false,
        };
        let added = false;
        set((s) => {
          // The onboarding consent is a real preference: with notifications
          // off, apps still work but nothing lands in the shade.
          if (!useTutorialStore.getState().notifications) return;
          s.notifications = [stored, ...s.notifications].slice(0, NOTIFICATION_LIMIT);
          added = true;
        });
        return added ? stored : null;
      },
      clearNotifications: () =>
        set((s) => {
          s.notifications = [];
          s.pillId = null;
        }),
      pruneExpired: (now) =>
        set((s) => {
          s.notifications = s.notifications.filter((notif) => !isExpired(notif, now));
        }),
      clearNotificationState: () =>
        set((s) => {
          s.notifications = [];
          s.notificationMeta = defaultNotificationMeta();
          s.pillId = null;
          s.pillSeq = 0;
        }),
    })),
    {
      name: 'phone-os:os',
      version: OS_PERSIST_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Persist only durable OS preferences, never transient UI state.
      partialize: (state): PersistedOS => ({
        theme: state.theme,
        clockSpeed: state.clockSpeed,
        status: state.status,
        controls: state.controls,
        layout: state.layout,
        recents: state.recents,
        notifications: state.notifications,
        notificationMeta: state.notificationMeta,
      }),
      migrate: migrateOS,
    },
  ),
);
