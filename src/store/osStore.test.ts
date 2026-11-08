import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_LAYOUT } from './defaults';
import { GAME_EPOCH, useGameStore } from './gameStore';
import { migrateOS, useOSStore } from './osStore';
import { useTutorialStore } from './tutorialStore';

function resetStore() {
  useOSStore.setState({
    locked: true,
    editing: false,
    openAppId: null,
    appSession: 0,
    recents: [],
    overlay: 'none',
    layout: {
      pages: DEFAULT_LAYOUT.pages.map((page) => [...page]),
      dock: [...DEFAULT_LAYOUT.dock],
    },
  });
}

beforeEach(resetStore);

describe('osStore / app stack', () => {
  it('opens an app and records it as the most recent', () => {
    useOSStore.getState().openApp('trade');

    expect(useOSStore.getState().openAppId).toBe('trade');
    expect(useOSStore.getState().recents[0]).toBe('trade');
  });

  it('closes the open app without losing recents', () => {
    const store = useOSStore.getState();
    store.openApp('notes');
    store.closeApp();

    expect(useOSStore.getState().openAppId).toBeNull();
    expect(useOSStore.getState().recents).toContain('notes');
  });

  it('keeps recents unique and most-recent-first', () => {
    const store = useOSStore.getState();
    store.openApp('trade');
    store.openApp('notes');
    store.openApp('trade');

    expect(useOSStore.getState().recents).toEqual(['trade', 'notes']);
  });

  it('closes any overlay when an app opens', () => {
    useOSStore.getState().setOverlay('control');
    useOSStore.getState().openApp('wallet');

    expect(useOSStore.getState().overlay).toBe('none');
    expect(useOSStore.getState().openAppId).toBe('wallet');
  });

  it('keeps the running app mounted behind system overlays', () => {
    useOSStore.getState().openApp('trade');
    useOSStore.getState().setOverlay('appSwitcher');

    expect(useOSStore.getState().overlay).toBe('appSwitcher');
    expect(useOSStore.getState().openAppId).toBe('trade');

    useOSStore.getState().setOverlay('none');
    expect(useOSStore.getState().openAppId).toBe('trade');
  });

  it('gives every app open its own session id', () => {
    const store = useOSStore.getState();
    store.openApp('notes');
    const first = useOSStore.getState().appSession;
    store.openApp('notes');

    expect(useOSStore.getState().appSession).toBeGreaterThan(first);
  });

  it('locking resets transient UI state', () => {
    useOSStore.getState().openApp('browser');
    useOSStore.getState().lock();

    expect(useOSStore.getState().locked).toBe(true);
    expect(useOSStore.getState().overlay).toBe('none');
  });
});

describe('osStore / home layout', () => {
  it('reorders icons inside a page', () => {
    useOSStore.getState().moveApp('notes', 'wallet');

    expect(useOSStore.getState().layout.pages[0].slice(0, 4)).toEqual(['notes', 'wallet', 'gmall', 'protean']);
  });

  it('moves an icon from a page into the dock', () => {
    useOSStore.getState().moveApp('notes', 'dock');

    const layout = useOSStore.getState().layout;
    expect(layout.pages[0]).not.toContain('notes');
    expect(layout.pages[0].slice(0, 3)).toEqual(['wallet', 'gmall', 'protean']);
    expect(layout.dock).toContain('notes');
  });

  it('moves an icon from the dock back onto a page', () => {
    useOSStore.getState().moveApp('trade', 'page:0');

    const layout = useOSStore.getState().layout;
    expect(layout.dock).not.toContain('trade');
    expect(layout.pages[0]).toContain('trade');
  });

  it('ignores moves onto itself', () => {
    const before = useOSStore.getState().layout.pages[0];
    useOSStore.getState().moveApp('wallet', 'wallet');

    expect(useOSStore.getState().layout.pages[0]).toEqual(before);
  });

  it('resets the home layout without sharing array references', () => {
    useOSStore.getState().moveApp('notes', 'dock');
    useOSStore.getState().resetLayout();

    expect(useOSStore.getState().layout.pages).toEqual(DEFAULT_LAYOUT.pages);
    expect(useOSStore.getState().layout.pages[0]).not.toBe(DEFAULT_LAYOUT.pages[0]);
  });
});

function resetNotifications() {
  useOSStore.setState({
    notifications: [],
    notificationMeta: { day: 1, todayCount: 0, lastByKey: {} },
    pillId: null,
    pillSeq: 0,
  });
  useGameStore.setState({ gameDateTime: GAME_EPOCH, day: 1 });
}

describe('osStore.notify', () => {
  beforeEach(resetNotifications);

  it('stores a delivered notification and returns it', () => {
    const out = useOSStore.getState().notify({
      type: 'bank.deposit',
      at: GAME_EPOCH,
      amount: 2_000_000,
      large: true,
      flagged: true,
    });
    expect(out).toHaveLength(1);
    expect(useOSStore.getState().notifications[0].priority).toBe('high');
  });

  it('applies the cooldown to repeats in the same group', () => {
    const ev = {
      type: 'shipment.landed' as const,
      at: GAME_EPOCH,
      shipmentId: 's1',
      status: 'arrived' as const,
      productName: '젤리',
      qty: 1,
    };
    expect(useOSStore.getState().notify(ev)).toHaveLength(1);
    expect(useOSStore.getState().notify({ ...ev, shipmentId: 's2' })).toHaveLength(0);
  });

  it('honours the notification consent switch', () => {
    useTutorialStore.setState({ notifications: false });
    expect(
      useOSStore
        .getState()
        .notify({
          type: 'messenger.arrival',
          at: GAME_EPOCH,
          npcId: 'npc-dal',
          npcName: '달',
          channel: 'telegraph',
        }),
    ).toHaveLength(0);
    useTutorialStore.setState({ notifications: true });
  });

  it('marks read and removes', () => {
    const [a] = useOSStore.getState().notify({
      type: 'bank.deposit',
      at: GAME_EPOCH,
      amount: 2_000_000,
      large: true,
      flagged: true,
    });
    useOSStore.getState().markNotificationRead(a.id);
    expect(useOSStore.getState().notifications[0].read).toBe(true);
    useOSStore.getState().removeNotification(a.id);
    expect(useOSStore.getState().notifications).toHaveLength(0);
  });
});

describe('osStore migration', () => {
  it('adds notifications + meta to a v11 save', () => {
    const migrated = migrateOS({ theme: 'dark', layout: DEFAULT_LAYOUT } as never, 11);
    expect(migrated.notifications).toEqual([]);
    expect(migrated.notificationMeta).toEqual({ day: 1, todayCount: 0, lastByKey: {} });
  });
});
