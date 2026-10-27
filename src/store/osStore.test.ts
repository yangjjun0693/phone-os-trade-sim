import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_LAYOUT } from './defaults';
import { useOSStore } from './osStore';

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
