import { describe, expect, it } from 'vitest';
import { heatFromCash, heatTier, decayHeat } from './heat';
import { computeOrderTotal, computeUnitPrice } from './pricing';
import { rollCustomerKind } from './customers';
import { suspicionScore } from './markets';
import type { MarketSite } from '@/types';

describe('pricing', () => {
  it('prices at base with no heat and no demand pressure', () => {
    expect(computeUnitPrice({ basePrice: 100, heat: 0, demand: 0 })).toBe(100);
  });

  it('scales up to 1.5x at maximum heat', () => {
    expect(computeUnitPrice({ basePrice: 100, heat: 100, demand: 0 })).toBe(150);
  });

  it('applies a capped bulk discount to order totals', () => {
    expect(computeUnitPrice({ basePrice: 100, heat: 0, demand: 0, bulkQty: 11 })).toBe(80);
    expect(computeOrderTotal({ basePrice: 100, heat: 0, demand: 0, bulkQty: 11 })).toBe(880);
  });
});

describe('heat', () => {
  it('maps heat onto risk tiers', () => {
    expect(heatTier(0)).toBe('calm');
    expect(heatTier(30)).toBe('watched');
    expect(heatTier(60)).toBe('hot');
    expect(heatTier(95)).toBe('burned');
  });

  it('adds risk for holding large amounts of cash', () => {
    expect(heatFromCash(400_000)).toBe(0);
    expect(heatFromCash(1_500_000)).toBeGreaterThan(0);
  });

  it('cools down over time but never below zero', () => {
    expect(decayHeat(10, 2)).toBe(8.5);
    expect(decayHeat(1, 100)).toBe(0);
  });
});

describe('customers', () => {
  it('produces undercover officers more often as heat rises', () => {
    const alwaysLow = () => 0.01;
    expect(rollCustomerKind(alwaysLow, 0)).toBe('undercover');
    expect(rollCustomerKind(alwaysLow, 100)).toBe('undercover');
  });

  it('never returns an unknown kind', () => {
    const kinds = new Set(['regular', 'difficult', 'undercover']);
    for (let i = 0; i < 200; i += 1) {
      expect(kinds.has(rollCustomerKind(Math.random, 40))).toBe(true);
    }
  });
});

describe('markets', () => {
  const site: MarketSite = {
    id: 'm1',
    name: 'Test',
    tagline: '',
    status: 'honeypot',
    reach: 'onion',
    priceMod: 1,
    traceHeat: 0,
    openedDaysAgo: 3,
    traits: ['too cheap'],
  };

  it('scores a suspected honeypot higher than a plain site', () => {
    const clue = { id: 'c1', marketId: 'm1', text: 'too good to be true', reliable: true };
    const honeypot = suspicionScore(site, [clue]);
    const plain = suspicionScore({ ...site, status: 'legit', traits: [] }, [clue]);

    expect(honeypot).toBeGreaterThan(plain);
    expect(honeypot).toBeLessThanOrEqual(100);
  });
});
