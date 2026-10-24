import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_LAYOUT } from './defaults';
import { useOSStore } from './osStore';

function resetStore() {
  useOSStore.setState({
    locked: true,
    editing: false,
    openAppId: null,
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

    expect(useOSStore.getState().layout.pages[0]).toEqual(['notes', 'wallet', 'gmall', 'protean']);
  });

  it('moves an icon from a page into the dock', () => {
    useOSStore.getState().moveApp('notes', 'dock');

    const layout = useOSStore.getState().layout;
    expect(layout.pages[0]).toEqual(['wallet', 'gmall', 'protean']);
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
