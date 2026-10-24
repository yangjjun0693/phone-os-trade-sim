import type { HomeLayout } from '@/types';

/**
 * Default home layout. Kept in its own module (no component imports) so that the
 * store — and its unit tests — do not have to pull in every app component.
 */
export const DEFAULT_DOCK = ['trade', 'messages', 'browser', 'settings'];

export const DEFAULT_PAGES: string[][] = [
  ['wallet', 'notes', 'mail', 'forum'],
  ['contacts'],
];

export const DEFAULT_LAYOUT: HomeLayout = {
  pages: DEFAULT_PAGES,
  dock: DEFAULT_DOCK,
};

export const PERSIST_VERSION = 1;
