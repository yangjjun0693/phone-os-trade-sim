import { describe, expect, it } from 'vitest';
import { markets, products } from '@/data';
import type { MarketSite } from '@/types';
import { browserAccess, listedMarkets, reachLabel } from './markets';
import { generateMarketOffers } from './trade';

const clearnet = markets.find((m) => m.reach === 'clearnet')!;
const mirror = markets.find((m) => m.reach === 'mirror')!;
const onion = markets.find((m) => m.reach === 'onion' && !m.invite)!;
const invite = markets.find((m) => m.invite)!;

const onionIds = markets.filter((m) => m.reach === 'onion').map((m) => m.id);

/** Mean lot size / price-to-wholesale ratio for a market across many days. */
function sample(market: MarketSite, days = 40) {
  let qty = 0;
  let ratio = 0;
  let count = 0;
  const byId = new Map(products.map((p) => [p.id, p]));
  for (let day = 1; day <= days; day += 1) {
    for (const offer of generateMarketOffers(market, products, day)) {
      qty += offer.qty;
      ratio += offer.unitPrice / (byId.get(offer.productId)?.wholesale ?? 1);
      count += 1;
    }
  }
  return { qty: qty / count, ratio: ratio / count };
}

describe('browser reach matrix', () => {
  it('chroma can only open clearnet shops', () => {
    expect(browserAccess(clearnet, 'chroma').ok).toBe(true);
    expect(browserAccess(mirror, 'chroma')).toEqual({ ok: false, reason: 'blocked-onion' });
    expect(browserAccess(onion, 'chroma')).toEqual({ ok: false, reason: 'blocked-onion' });
  });

  it('sailor reaches mirrors but not the onion originals', () => {
    expect(browserAccess(clearnet, 'sailor').ok).toBe(true);
    expect(browserAccess(mirror, 'sailor').ok).toBe(true);
    expect(browserAccess(onion, 'sailor')).toEqual({ ok: false, reason: 'server-not-found' });
  });

  it('shade reaches the onion layer once the address is known', () => {
    expect(browserAccess(onion, 'shade').ok).toBe(false);
    expect(browserAccess(onion, 'shade', [onion.id]).ok).toBe(true);
    expect(browserAccess(mirror, 'shade').ok).toBe(true);
  });

  it('asks for an invite on invite-only sites', () => {
    expect(browserAccess(invite, 'shade', [])).toEqual({ ok: false, reason: 'invite-required' });
    expect(browserAccess(invite, 'shade', [invite.id]).ok).toBe(true);
  });

  it('lists only what each browser can actually use', () => {
    expect(listedMarkets(markets, 'chroma').every((m) => m.reach === 'clearnet')).toBe(true);

    const sailor = listedMarkets(markets, 'sailor');
    expect(sailor.some((m) => m.reach === 'mirror')).toBe(true);
    expect(sailor.every((m) => m.reach !== 'onion')).toBe(true);

    expect(listedMarkets(markets, 'shade', []).some((m) => m.reach === 'onion')).toBe(false);
    const known = listedMarkets(markets, 'shade', onionIds);
    expect(known.filter((m) => m.reach === 'onion')).toHaveLength(onionIds.length);
  });

  it('labels each network layer', () => {
    expect(reachLabel('clearnet')).toBe('일반');
    expect(reachLabel('mirror')).toBe('미러');
    expect(reachLabel('onion')).toBe('다크넷');
  });
});

describe('layer pricing and lot size', () => {
  it('prices the onion originals below the clearnet shops', () => {
    const onionRatio = sample(onion).ratio;
    const clearnetRatio = sample(clearnet).ratio;
    expect(onionRatio).toBeLessThan(clearnetRatio);
  });

  it('sells bigger lots over onion than over clearnet', () => {
    expect(sample(onion).qty).toBeGreaterThan(sample(clearnet).qty);
  });

  it('charges a mirror fee, and discounts the onion originals', () => {
    // Mirrors add a fee on top of their status; onion originals undercut retail.
    for (const market of markets) {
      if (market.reach === 'mirror') expect(market.priceMod).toBeGreaterThan(1);
      if (market.reach === 'onion') expect(market.priceMod).toBeLessThan(1);
      if (market.reach === 'clearnet') expect(market.priceMod).toBe(1);
    }
  });
});
