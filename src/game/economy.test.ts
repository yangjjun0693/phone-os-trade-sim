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
import { generateMarketOffers, resolveDayEnd } from './trade';

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
  /** Average margin of one unit sold at street value. */
  const avgUnitMargin =
    products.reduce((sum, product) => sum + (product.street - product.wholesale), 0) /
    products.length;

  /**
   * The sell side is the real bottleneck: a customer takes 1–6 units and every
   * action costs in-game time. This models a busy but plausible day.
   */
  const SALES_PER_DAY = 10;
  const AVG_UNITS_PER_SALE = 3.5;

  const grossPerDay = SALES_PER_DAY * AVG_UNITS_PER_SALE * avgUnitMargin;
  const worstRent = RENT_BASE + RENT_STEP_MAX_DAY * RENT_STEP;
  const netPerDay = grossPerDay - worstRent;
  const monthNet = netPerDay * MAX_DAYS;

  it('clears the day expenses on a plausible day of trading', () => {
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
