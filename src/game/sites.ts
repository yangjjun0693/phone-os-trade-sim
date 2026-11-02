import type { BrowserSite, MarketReach, MarketSite, SiteKind } from '@/types';
import { reachAccess, type AccessResult, type BrowserId } from './markets';

/**
 * Everyday-site logic. Pure functions only: the browser shells and the site
 * renderers read from here, so the rules stay testable without React.
 */

/** Can a browser open this everyday site? Same reach rules as markets. */
export function browserSiteAccess(
  site: BrowserSite,
  browser: BrowserId,
  discovered: readonly string[] = [],
): AccessResult {
  return reachAccess(site.reach, site.invite, site.id, browser, discovered);
}

/** Sites a browser lists on its start page. */
export function listedSites(
  all: readonly BrowserSite[],
  browser: BrowserId,
  discovered: readonly string[] = [],
): BrowserSite[] {
  return all.filter((site) => {
    if (browser === 'chroma') return site.reach === 'clearnet';
    if (browser === 'sailor') return site.reach !== 'onion';
    return site.reach !== 'onion' || discovered.includes(site.id);
  });
}

export interface SearchResults {
  sites: BrowserSite[];
  markets: MarketSite[];
}

/**
 * Sleuth search. Matches everyday sites and markets that the *current* browser
 * can actually reach, so results never lead to a blocked page. Undiscovered
 * onion addresses never surface, which keeps the social/wiki loop that hands
 * them out meaningful.
 */
export function searchAll(
  query: string,
  sites: readonly BrowserSite[],
  markets: readonly MarketSite[],
  browser: BrowserId,
  discovered: readonly string[] = [],
): SearchResults {
  const q = query.trim().toLowerCase();
  if (!q) return { sites: [], markets: [] };

  const match = (name: string, tagline: string) =>
    name.toLowerCase().includes(q) || tagline.toLowerCase().includes(q);

  const reachable = (reach: MarketReach, invite: boolean | undefined, id: string) =>
    reachAccess(reach, invite, id, browser, discovered).ok;

  return {
    sites: sites.filter((s) => reachable(s.reach, s.invite, s.id) && match(s.name, s.tagline)),
    markets: markets.filter(
      (m) => reachable(m.reach, m.invite, m.id) && match(m.name, m.tagline),
    ),
  };
}

/** Rough test for "the player typed an address, not a search query". */
export function isLikelyUrl(input: string): boolean {
  const value = input.trim();
  if (!value) return false;
  if (value.startsWith('hxxp://') || value.startsWith('hxxps://')) return true;
  return value.includes('.') && !value.includes(' ');
}

export function siteKindLabel(kind: SiteKind): string {
  switch (kind) {
    case 'search':
      return '검색';
    case 'video':
      return '영상';
    case 'classifieds':
      return '중고';
    case 'wiki':
      return '위키';
  }
}
