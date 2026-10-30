import type { HomeLayout } from '@/types';

/**
 * Default home layout. Kept in its own module (no component imports) so that the
 * store — and its unit tests — do not have to pull in every app component.
 */
export const DEFAULT_DOCK = ['trade', 'messagesCall', 'chroma', 'settings'];

/**
 * Every app lives on a single home page, so nothing needs swiping: the dock
 * holds the four most-used apps and the grid below holds the rest (4 × 4).
 */
export const DEFAULT_PAGES: string[][] = [
  [
    'wallet', 'notes', 'gmall', 'protean',
    'telegraph', 'ex', 'forum', 'sailor',
    'shade', 'contacts', 'map', 'bank',
    'news', 'delivery', 'amason', 'steak',
  ],
];

export const DEFAULT_LAYOUT: HomeLayout = {
  pages: DEFAULT_PAGES,
  dock: DEFAULT_DOCK,
};

export function cloneLayout(layout: HomeLayout): HomeLayout {
  return { pages: layout.pages.map((page) => [...page]), dock: [...layout.dock] };
}

/**
 * Add any default app a saved layout is missing — the case where the game
 * shipped a new app after that save was written — and leave the order the
 * player arranged alone. Used by the OS migration when a version bump lands.
 */
export function withMissingDefaultApps(layout: HomeLayout | undefined): HomeLayout {
  if (!layout?.pages?.length) return cloneLayout(DEFAULT_LAYOUT);
  const present = new Set([...layout.pages.flat(), ...(layout.dock ?? [])]);
  const missing = DEFAULT_PAGES.flat().filter((id) => !present.has(id));
  if (missing.length === 0) return layout;
  const next = cloneLayout({ pages: layout.pages, dock: layout.dock ?? [] });
  next.pages[next.pages.length - 1].push(...missing);
  return next;
}

export const PERSIST_VERSION = 9;
/** Home layout schema version; bumped separately so game saves are not wiped. */
export const OS_PERSIST_VERSION = 11;
