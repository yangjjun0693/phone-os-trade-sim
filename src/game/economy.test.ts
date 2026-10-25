import { describe, expect, it } from 'vitest';
import { markets, products } from '@/data';
import {
  BANK_QUICK_AMOUNTS,
  CHIP_QUICK_AMOUNTS,
  HEAT_CASH_SAFE,
  MAX_DAYS,
  RENT_BASE,
  RENT_STEP,
  RENT_STEP_MAX_DAY,
  RETIRE_GOAL,
  START_BANK,
  START_CASH,
} from '@/content/economy';
import { RUNNERS } from '@/content/runners';
import { generateMarketOffers, priceDrift, resolveDayEnd, trustMultiplier } from './trade';

/**
 * Balance guards for the KRW economy. These are not gameplay tests — they keep
 * the numbers in `src/content/economy.ts` self-consistent as content grows.
 */
describe('economy: content invariants', () => {
  it('prices every product above its wholesale cost', () => {
    for (const product of products) {
      expect(product.street, product.name).toBeGreaterThan(product.wholesale);
      expect(product.wholesale).toBeGreaterThan(0);
    }
  });

  it('starts the player below the retirement goal, but not hopelessly so', () => {
    const start = START_CASH + START_BANK;
    expect(start).toBeLessThan(RETIRE_GOAL * 0.4);
    expect(start).toBeGreaterThan(RETIRE_GOAL * 0.15);
  });

  it('lists quick amounts in ascending order', () => {
    for (const list of [BANK_QUICK_AMOUNTS, CHIP_QUICK_AMOUNTS]) {
      expect([...list].sort((a, b) => a - b)).toEqual(list);
    }
  });
});

describe('economy: street prices move', () => {
  it('stays inside a sane band and never rerolls mid-day', () => {
    for (const product of products) {
      const today = priceDrift(product.id, 3);
      expect(today).toBeGreaterThanOrEqual(0.9);
      expect(today).toBeLessThanOrEqual(1.1);
      expect(priceDrift(product.id, 3)).toBe(today);
    }
  });

  it('actually differs from one day to the next', () => {
    let changed = 0;
    for (const product of products) {
      if (priceDrift(product.id, 1) !== priceDrift(product.id, 2)) changed += 1;
    }
    expect(changed).toBeGreaterThan(0);
  });

  it('carries the drift into the offers the markets show', () => {
    const offer = generateMarketOffers(markets[0], products, 5)[0];
    const product = products.find((entry) => entry.id === offer.productId)!;
    expect(offer.marketPrice).toBe(Math.max(1, Math.round(product.street * offer.drift)));
    expect(offer.drift).toBe(priceDrift(offer.productId, 5));
  });
});

describe('economy: trust moves the price', () => {
  it('climbs with trust, from below street to above it', () => {
    expect(trustMultiplier(0)).toBeLessThan(1);
    expect(trustMultiplier(100)).toBeGreaterThan(1);
    expect(trustMultiplier(60)).toBeGreaterThan(trustMultiplier(20));
    // Neutral-ish for a fresh run.
    expect(trustMultiplier(20)).toBeCloseTo(0.99, 2);
  });
});

describe('economy: rent', () => {
  it('charges the base rent plus one step on day 1', () => {
    const report = resolveDayEnd({ day: 1, cash: 5_000_000, heat: 0, bankBalance: 0 }, () => 0.99);
    expect(report.rent).toBe(RENT_BASE + RENT_STEP);
  });

  it('stops climbing after the cap day', () => {
    const cap = RENT_BASE + RENT_STEP_MAX_DAY * RENT_STEP;
    const late = resolveDayEnd({ day: MAX_DAYS, cash: 5_000_000, heat: 0, bankBalance: 0 }, () => 0.99);
    expect(late.rent).toBe(cap);
  });

  it('keeps a day of expenses small next to a day of trade', () => {
    const worstRent = RENT_BASE + RENT_STEP_MAX_DAY * RENT_STEP;
    expect(START_BANK).toBeGreaterThan(worstRent * 20);
    expect(worstRent).toBeLessThan(RETIRE_GOAL * 0.01);
  });
});

describe('economy: the day loop is winnable but not trivial', () => {
  // Market goods are the baseline; special goods come from vendors and are
  // modelled separately by the runner income below.
  const standard = products.filter((product) => product.tier !== 'special');
  /** Average margin of one unit sold at street value. */
  const avgUnitMargin =
    standard.reduce((sum, product) => sum + (product.street - product.wholesale), 0) /
    standard.length;

  /**
   * The sell side is the real bottleneck: a customer takes 1–6 units and every
   * action costs in-game time. This models a busy but plausible day.
   */
  const SALES_PER_DAY = 10;
  const AVG_UNITS_PER_SALE = 3.5;

  const grossPerDay = SALES_PER_DAY * AVG_UNITS_PER_SALE * avgUnitMargin;
  const worstRent = RENT_BASE + RENT_STEP_MAX_DAY * RENT_STEP;
  // Hired runners sell in the background; assume a small share gets caught.
  const runnerPerDay =
    RUNNERS.reduce((sum, runner) => sum + runner.dailyNet, 0) *
    (1 - RUNNERS.reduce((sum, runner) => sum + runner.catchChance, 0) / RUNNERS.length);
  const netPerDay = grossPerDay + runnerPerDay - worstRent;
  const monthNet = netPerDay * MAX_DAYS;

  it('clears the day expenses on a plausible day of trading', () => {
    expect(grossPerDay).toBeGreaterThan(worstRent);
    expect(netPerDay).toBeGreaterThan(0);
  });

  it('reaches the goal inside the month, with room for mistakes', () => {
    expect(monthNet).toBeGreaterThan(RETIRE_GOAL * 1.2);
    expect(monthNet).toBeLessThan(RETIRE_GOAL * 3);
  });

  it('needs more than a few days of good trading', () => {
    expect(netPerDay * 5).toBeLessThan(RETIRE_GOAL);
  });

  it('can supply an order out of the starting cash', () => {
    const cheapestLot = Math.min(...products.map((product) => product.wholesale)) * 4;
    expect(HEAT_CASH_SAFE).toBeGreaterThan(0);
    expect(cheapestLot).toBeLessThan(START_CASH);
  });

  it('offers every network layer some stock each day', () => {
    for (const market of markets) {
      expect(generateMarketOffers(market, products, 1).length).toBeGreaterThan(0);
    }
  });
});
