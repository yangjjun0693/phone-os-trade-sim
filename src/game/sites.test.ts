import { describe, expect, it } from 'vitest';
import { BROWSER_SITES } from '@/content/sites';
import { markets } from '@/data';
import { browserSiteAccess, isLikelyUrl, listedSites, searchAll, siteKindLabel } from './sites';

const onion = BROWSER_SITES.find((site) => site.id === 'openpedia-onion')!;
const clearnet = BROWSER_SITES.find((site) => site.id === 'viewtube')!;

describe('browserSiteAccess', () => {
  it('blocks onion sites in Chroma and Sailor', () => {
    expect(browserSiteAccess(onion, 'chroma')).toEqual({ ok: false, reason: 'blocked-onion' });
    expect(browserSiteAccess(onion, 'sailor')).toEqual({ ok: false, reason: 'server-not-found' });
  });

  it('lets Shade open an onion site only once it is discovered', () => {
    expect(browserSiteAccess(onion, 'shade')).toEqual({ ok: false, reason: 'invite-required' });
    expect(browserSiteAccess(onion, 'shade', [onion.id])).toEqual({ ok: true });
  });

  it('opens clearnet sites in every browser', () => {
    for (const browser of ['chroma', 'sailor', 'shade'] as const) {
      expect(browserSiteAccess(clearnet, browser)).toEqual({ ok: true });
    }
  });
});

describe('listedSites', () => {
  it('lists only clearnet sites on Chroma', () => {
    const listed = listedSites(BROWSER_SITES, 'chroma');
    expect(listed.length).toBeGreaterThan(0);
    expect(listed.every((site) => site.reach === 'clearnet')).toBe(true);
    expect(listed.some((site) => site.id === 'viewtube')).toBe(true);
  });

  it('hides an undiscovered onion site from Shade, then shows it', () => {
    expect(listedSites(BROWSER_SITES, 'shade').some((s) => s.id === onion.id)).toBe(false);
    expect(listedSites(BROWSER_SITES, 'shade', [onion.id]).some((s) => s.id === onion.id)).toBe(
      true,
    );
  });
});

describe('searchAll', () => {
  it('matches everyday sites by name', () => {
    const results = searchAll('view', BROWSER_SITES, markets, 'chroma');
    expect(results.sites.map((site) => site.id)).toContain('viewtube');
  });

  it('never surfaces an undiscovered onion market', () => {
    const hidden = searchAll('nightbazaar', BROWSER_SITES, markets, 'shade', []);
    expect(hidden.markets.some((m) => m.id === 'market-nightbazaar')).toBe(false);

    const shown = searchAll('nightbazaar', BROWSER_SITES, markets, 'shade', [
      'market-nightbazaar',
    ]);
    expect(shown.markets.some((m) => m.id === 'market-nightbazaar')).toBe(true);
  });

  it('never shows an onion market to Chroma, even when discovered', () => {
    const results = searchAll('nightbazaar', BROWSER_SITES, markets, 'chroma', [
      'market-nightbazaar',
    ]);
    expect(results.markets).toHaveLength(0);
  });

  it('returns nothing for an empty or whitespace query', () => {
    expect(searchAll('   ', BROWSER_SITES, markets, 'chroma')).toEqual({ sites: [], markets: [] });
  });
});

describe('isLikelyUrl', () => {
  it('treats addresses as URLs and plain words as searches', () => {
    expect(isLikelyUrl('hxxp://viewtube.kr')).toBe(true);
    expect(isLikelyUrl('nightbazaar.onion')).toBe(true);
    expect(isLikelyUrl('밤의 마켓')).toBe(false);
    expect(isLikelyUrl('night bazaar')).toBe(false);
    expect(isLikelyUrl('')).toBe(false);
  });
});

describe('siteKindLabel', () => {
  it('labels every kind in Korean', () => {
    expect(siteKindLabel('video')).toBe('영상');
    expect(siteKindLabel('search')).toBe('검색');
    expect(siteKindLabel('classifieds')).toBe('중고');
    expect(siteKindLabel('wiki')).toBe('위키');
  });
});
