import { nanoid } from 'nanoid';
import { BROWSER_SITES } from '@/content/sites';

export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  loading: boolean;
  /** 0..1 simulated load progress. */
  progress: number;
  marketId?: string;
  /** Set when the address resolves to an everyday site (see content/sites.ts). */
  siteId?: string;
}

/**
 * Fake addresses, mapped onto the game's market ids. Clearnet shops get normal
 * looking domains, everything on the dark net is `.onion`.
 */
export const MOCK_SITES: { url: string; title: string; marketId: string | null }[] = [
  { url: 'hxxp://gaon-pharmacy.kr', title: '가온약국', marketId: 'market-pharmacy' },
  { url: 'hxxp://gaon-mart.kr', title: '가온마트', marketId: 'market-hyper' },
  { url: 'hxxp://clearnet-mirror.onion', title: 'ClearNet-Mirror', marketId: 'market-clearnet' },
  { url: 'hxxp://quickdrop.onion', title: 'QuickDrop', marketId: 'market-quickdrop' },
  { url: 'hxxp://nightbazaar.onion', title: 'NightBazaar', marketId: 'market-nightbazaar' },
  { url: 'hxxp://lastcall.onion', title: 'LastCall', marketId: 'market-lastcall' },
  { url: 'hxxp://shadowgoods.onion', title: 'ShadowGoods', marketId: null },
  { url: 'hxxp://darkweb-mall.onion', title: 'DarkWeb Mall', marketId: null },
];

/** The everyday search engine — its address doubles as the search entry point. */
const SEARCH_SITE = BROWSER_SITES.find((site) => site.kind === 'search');
export const SEARCH_URL = SEARCH_SITE?.url ?? 'hxxp://sleuth.kr';

/** Where each browser opens when it starts fresh (its own kind of home page). */
export const START_URLS = {
  chroma: 'hxxp://gaon-pharmacy.kr',
  sailor: 'hxxp://clearnet-mirror.onion',
  shade: 'hxxp://nightbazaar.onion',
} as const;

/** Stable fake URL for a market id, shared by all three browsers. */
export function marketUrl(marketId: string): string {
  return (
    MOCK_SITES.find((site) => site.marketId === marketId)?.url ??
    `hxxp://${marketId.replace(/^market-/, '')}.onion`
  );
}

/** Map a typed or clicked URL back onto a market id. */
export function marketIdFromUrl(url: string): string | undefined {
  const normalized = url.trim().toLowerCase().replace(/\/+$/, '');
  const site = MOCK_SITES.find(
    (entry) => entry.url === normalized || entry.url === `hxxp://${normalized}`,
  );
  return site?.marketId ?? undefined;
}

function hostnameOf(url: string): string | undefined {
  try {
    return new URL(url.replace('hxxp://', 'http://')).hostname;
  } catch {
    return undefined;
  }
}

/**
 * Resolve an address (including paths/queries like `…/search?q=x`) onto an
 * everyday site id. Matching is by host, so search URLs still map to Sleuth.
 */
export function siteIdFromUrl(url: string): string | undefined {
  const host = hostnameOf(url);
  if (!host) return undefined;
  return BROWSER_SITES.find((site) => hostnameOf(site.url) === host)?.id;
}

/** Build a Sleuth search address for a free-text query. */
export function searchUrl(query: string): string {
  return `${SEARCH_URL}/search?q=${encodeURIComponent(query.trim())}`;
}

/** Read the query back out of a search address, if present. */
export function searchQueryFromUrl(url: string): string {
  const match = /[?&]q=([^&]*)/.exec(url);
  if (!match) return '';
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/** `hxxp://nightbazaar.onion` -> `NightBazaar` (best effort). */
export function extractTitle(url: string): string {
  const normalized = url.trim().toLowerCase();
  const market = MOCK_SITES.find((site) => site.url === normalized);
  if (market) return market.title;

  const host = hostnameOf(url);
  const site = BROWSER_SITES.find((entry) => hostnameOf(entry.url) === host);
  if (site) return site.name;

  if (host) return host.replace('.onion', '').replace(/^www\./, '') || url;
  try {
    const fallback = new URL(url.replace('hxxp://', 'http://')).hostname;
    return fallback.replace('.onion', '').replace(/^www\./, '') || url;
  } catch {
    return url;
  }
}

/** A blank new tab. `hxxp:` with nothing after it is treated as the start page. */
export function createTab(url = 'hxxp://'): BrowserTab {
  return {
    id: `tab-${nanoid()}`,
    url,
    title: url === 'hxxp://' ? '새 탭' : extractTitle(url),
    loading: false,
    progress: url === 'hxxp://' ? 0 : 1,
    marketId: marketIdFromUrl(url),
    siteId: siteIdFromUrl(url),
  };
}

/** True for an untouched "new tab" page. */
export function isBlankTab(tab: BrowserTab | null | undefined): boolean {
  if (!tab) return true;
  return tab.url.trim().replace(/\/+$/, '') === 'hxxp:';
}

/** A short, browser-chrome friendly label for a URL. */
export function displayHost(url: string): string {
  return url.replace(/^hxxp:\/\//, '').replace(/\/+$/, '') || '새 탭';
}
