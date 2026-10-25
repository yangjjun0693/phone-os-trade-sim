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
import { DEFAULT_LAYOUT, OS_PERSIST_VERSION } from './defaults';

const RECENTS_LIMIT = 8;

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
  status: PhoneStatus;
  controls: OSControls;
  layout: HomeLayout;
  /** Home-screen icon edit (jiggle) mode. */
  editing: boolean;
  /** Currently open app, or null when the home screen is showing. */
  openAppId: string | null;
  recents: string[];
  overlay: OverlayKind;
  notifications: GameNotification[];

  lock: () => void;
  unlock: () => void;
  toggleLock: () => void;
  setTheme: (theme: ThemeMode) => void;
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
  pushNotification: (notification: GameNotification) => void;
  clearNotifications: () => void;
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

type PersistedOS = Pick<OSState, 'theme' | 'status' | 'controls' | 'layout' | 'recents'>;

export const useOSStore = create<OSState>()(
  persist(
    immer((set) => ({
      locked: true,
      theme: 'system',
      status: { battery: 82, charging: false, signal: 4, wifi: true },
      controls: {
        brightness: 0.72,
        volume: 0.45,
        airplane: false,
        bluetooth: true,
        flashlight: false,
      },
      layout: DEFAULT_LAYOUT,
      editing: false,
      openAppId: null,
      recents: [],
      overlay: 'none',
      notifications: [
        {
          id: 'seed-1',
          appId: 'messages',
          title: '메시지',
          body: '"그 물건 아직 있냐? 오늘 밤에 볼 수 있어."',
          date: '2026-03-14T21:12:00.000Z',
        },
        {
          id: 'seed-2',
          appId: 'browser',
          title: '브라우저',
          body: '새 마켓 1곳이 온라인 상태가 되었습니다.',
          date: '2026-03-14T20:40:00.000Z',
        },
      ],

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
      openApp: (appId) =>
        set((s) => {
          s.openAppId = appId;
          s.overlay = 'none';
          s.editing = false;
          s.recents = [appId, ...s.recents.filter((id) => id !== appId)].slice(0, RECENTS_LIMIT);
        }),
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
          if (overlay !== 'none') s.openAppId = null;
        }),
      pushNotification: (notification) =>
        set((s) => {
          s.notifications = [notification, ...s.notifications].slice(0, 20);
        }),
      clearNotifications: () =>
        set((s) => {
          s.notifications = [];
        }),
    })),
    {
      name: 'phone-os:os',
      version: OS_PERSIST_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Persist only durable OS preferences, never transient UI state.
      partialize: (state): PersistedOS => ({
        theme: state.theme,
        status: state.status,
        controls: state.controls,
        layout: state.layout,
        recents: state.recents,
      }),
      migrate: (persisted, version) => {
        const previous = (persisted ?? {}) as Partial<PersistedOS>;
        if (version < 1) return { ...previous, layout: DEFAULT_LAYOUT } as PersistedOS;
        if (version < 7) return { ...previous, layout: DEFAULT_LAYOUT } as PersistedOS;
        return previous as PersistedOS;
      },
    },
  ),
);
