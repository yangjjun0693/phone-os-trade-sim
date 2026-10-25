import { describe, expect, it } from 'vitest';
import type { InventoryItem, MarketSite, NpcProfile, Product } from '@/types';
import {
  RETIRE_GOAL,
  addToInventory,
  createCustomerOffer,
  generateMarketOffers,
  removeFromInventory,
  resolveCounter,
  resolveDayEnd,
  resolvePurchase,
  totalWealth,
  type CustomerOffer,
} from './trade';

const market: MarketSite = {
  id: 'market-test',
  name: 'TestMarket',
  tagline: 'test',
  status: 'legit',
  reach: 'onion',
  accent: '#0a84ff',
  priceMod: 1,
  traceHeat: 0,
  openedDaysAgo: 30,
  traits: [],
};

const products: Product[] = [
  { id: 'p1', name: '미상의 알약', category: '알약', wholesale: 20, street: 50 },
  { id: 'p2', name: '파란 캡슐', category: '캡슐', wholesale: 40, street: 100 },
];

const npcs: NpcProfile[] = [
  { id: 'n1', name: '달이', kind: 'regular', bio: '단골', channel: 'telegraph' },
  { id: 'n2', name: '찐빵', kind: 'difficult', bio: '진상', channel: 'phone' },
  {
    id: 'n3',
    name: '박 씨',
    kind: 'undercover',
    bio: '수상함',
    channel: 'phone',
    altChannel: 'telegraph',
  },
];

const inventory: InventoryItem[] = [
  { id: 'i1', productId: 'p1', name: '미상의 알약', qty: 10, unitCost: 20, marketPrice: 50 },
];

function customerOffer(overrides: Partial<CustomerOffer> = {}): CustomerOffer {
  return {
    id: 'c1',
    profileId: 'n1',
    name: '달이',
    kind: 'regular',
    itemId: 'i1',
    itemName: '미상의 알약',
    qty: 3,
    unitPrice: 50,
    total: 150,
    patience: 70,
    bio: '단골',
    ...overrides,
  };
}

describe('market offers', () => {
  it('keeps stock stable for a market and day', () => {
    const first = generateMarketOffers(market, products, 3);
    const second = generateMarketOffers(market, products, 3);
    const nextDay = generateMarketOffers(market, products, 4);

    expect(first).toEqual(second);
    expect(first).toHaveLength(2);
    expect(first).not.toEqual(nextDay);
  });

  it('prices a suspicious site below a legitimate one', () => {
    const legit = generateMarketOffers(market, products, 2)[0];
    const scam = generateMarketOffers({ ...market, status: 'scam' }, products, 2)[0];

    expect(scam.unitPrice).toBeLessThan(legit.unitPrice);
    expect(legit.marketPrice).toBeGreaterThan(legit.unitPrice);
  });
});

describe('purchase resolution', () => {
  const offer = generateMarketOffers(market, products, 1)[0];

  it('always delivers a legitimate order', () => {
    const outcome = resolvePurchase(offer, 'legit', () => 0.5);

    expect(outcome.kind).toBe('delivered');
    expect(outcome.deliveredQty).toBe(offer.qty);
    expect(outcome.spent).toBe(offer.unitPrice * offer.qty);
  });

  it('usually delivers nothing from a scam site', () => {
    const outcome = resolvePurchase(offer, 'scam', () => 0.99);

    expect(outcome.kind).toBe('scammed');
    expect(outcome.deliveredQty).toBe(0);
    expect(outcome.heatDelta).toBeGreaterThan(0);
  });

  it('makes a honeypot expensive in heat', () => {
    const outcome = resolvePurchase(offer, 'honeypot', () => 0.99);

    expect(outcome.kind).toBe('honeypot');
    expect(outcome.sting).toBe(true);
    expect(outcome.heatDelta).toBeGreaterThanOrEqual(20);
  });

  it('can lose the money when a closing site vanishes', () => {
    const outcome = resolvePurchase(offer, 'closing', () => 0.99);

    expect(outcome.kind).toBe('closed');
    expect(outcome.deliveredQty).toBe(0);
    expect(outcome.message).toContain('폐쇄');
  });
});

describe('inventory', () => {
  it('merges deliveries and keeps a weighted average cost', () => {
    const merged = addToInventory(inventory, {
      productId: 'p1',
      name: '미상의 알약',
      qty: 10,
      unitCost: 30,
      marketPrice: 50,
    });

    expect(merged).toHaveLength(1);
    expect(merged[0].qty).toBe(20);
    expect(merged[0].unitCost).toBe(25);
  });

  it('creates a new stack and drops empty stacks', () => {
    const added = addToInventory(inventory, {
      productId: 'p2',
      name: '파란 캡슐',
      qty: 4,
      unitCost: 40,
      marketPrice: 100,
    });
    expect(added).toHaveLength(2);

    const removed = removeFromInventory(inventory, 'i1', 10);
    expect(removed).toHaveLength(0);
  });
});

describe('customers', () => {
  it('returns null when there is nothing to sell', () => {
    expect(createCustomerOffer([], npcs, 10, () => 0.5)).toBeNull();
  });

  it('never asks for more than the stack holds', () => {
    for (let i = 0; i < 50; i += 1) {
      const offer = createCustomerOffer(inventory, npcs, 40, Math.random);
      expect(offer).not.toBeNull();
      expect(offer!.qty).toBeGreaterThanOrEqual(1);
      expect(offer!.qty).toBeLessThanOrEqual(6);
      expect(offer!.qty).toBeLessThanOrEqual(10);
      expect(offer!.unitPrice).toBeGreaterThan(0);
    }
  });

  it('can produce an undercover buyer at high heat', () => {
    const offer = createCustomerOffer(inventory, npcs, 100, () => 0.01);
    expect(offer?.kind).toBe('undercover');
  });

  it('accepts a counter-offer more readily from a regular than a difficult buyer', () => {
    const regular = resolveCounter(customerOffer(), () => 0.4);
    const difficult = resolveCounter(customerOffer({ kind: 'difficult' }), () => 0.4);

    expect(regular.accepted).toBe(true);
    expect(difficult.accepted).toBe(false);
    expect(regular.unitPrice).toBeGreaterThan(50);
  });
});

describe('day end', () => {
  it('charges rent, cools heat and advances the report day', () => {
    const report = resolveDayEnd(
      { day: 1, cash: 1_000_000, heat: 50, bankBalance: 0 },
      () => 0.99,
    );

    expect(report.rent).toBe(27_000);
    expect(report.paidFromCash).toBe(27_000);
    expect(report.cashAfter).toBe(973_000);
    expect(report.heatAfter).toBeLessThan(50);
    expect(report.status).toBe('playing');
  });

  it('takes rent from the bank when cash is short', () => {
    const report = resolveDayEnd(
      { day: 2, cash: 10, heat: 0, bankBalance: 1_000_000 },
      () => 0.99,
    );

    expect(report.paidFromCash).toBe(10);
    expect(report.paidFromBank).toBe(report.rent - 10);
    expect(report.bankAfter).toBe(1_000_000 - (report.rent - 10));
  });

  it('retires once cash plus bank reaches the goal', () => {
    const report = resolveDayEnd(
      { day: 10, cash: RETIRE_GOAL + 5_000_000, heat: 0, bankBalance: 0 },
      () => 0.99,
    );

    expect(report.status).toBe('retired');
    expect(report.totalWealth).toBeGreaterThanOrEqual(RETIRE_GOAL);
  });

  it('ends the run after the final day', () => {
    const report = resolveDayEnd(
      { day: 30, cash: 100, heat: 0, bankBalance: 0 },
      () => 0.99,
    );

    expect(report.status).toBe('busted');
    expect(report.reason).toContain('30일');
  });

  it('combines cash and bank into net worth', () => {
    expect(totalWealth(1200, 8800)).toBe(10_000);
  });
});
