import { describe, expect, it } from 'vitest';
import { DEFAULT_DOCK, DEFAULT_PAGES, cloneLayout, withMissingDefaultApps } from './defaults';

describe('home layout defaults', () => {
  it('holds every default app exactly once', () => {
    const ids = [...DEFAULT_PAGES.flat(), ...DEFAULT_DOCK];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives a fresh install the default layout', () => {
    expect(withMissingDefaultApps(undefined)).toEqual({
      pages: DEFAULT_PAGES,
      dock: DEFAULT_DOCK,
    });
  });

  it('appends an app a save does not know about, keeping the arrangement', () => {
    // A save from before the storefront existed: no `amason` anywhere.
    const saved = {
      pages: [['wallet', 'notes'], ['gmall']],
      dock: ['trade', 'settings'],
    };
    const next = withMissingDefaultApps(saved);

    expect(next.pages[0]).toEqual(['wallet', 'notes']);
    expect(next.pages[1][0]).toBe('gmall');
    // Everything missing lands on the last page, in default order.
    const missing = DEFAULT_PAGES.flat().filter((id) => !saved.pages.flat().includes(id) && !saved.dock.includes(id));
    expect(next.pages[1].slice(1)).toEqual(missing);
    expect(next.dock).toEqual(['trade', 'settings']);
    // The save is not mutated.
    expect(saved.pages[1]).toEqual(['gmall']);
  });

  it('leaves a complete layout untouched', () => {
    const complete = cloneLayout({ pages: DEFAULT_PAGES, dock: DEFAULT_DOCK });
    expect(withMissingDefaultApps(complete)).toBe(complete);
  });

  it('falls back to the default layout when pages are missing', () => {
    expect(withMissingDefaultApps({ pages: [], dock: [] })).toEqual({
      pages: DEFAULT_PAGES,
      dock: DEFAULT_DOCK,
    });
  });
});
