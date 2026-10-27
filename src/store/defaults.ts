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
    'news', 'delivery', 'steak',
  ],
];

export const DEFAULT_LAYOUT: HomeLayout = {
  pages: DEFAULT_PAGES,
  dock: DEFAULT_DOCK,
};

export const PERSIST_VERSION = 9;
/** Home layout schema version; bumped separately so game saves are not wiped. */
export const OS_PERSIST_VERSION = 10;
