import { describe, expect, it } from 'vitest';
import { products } from '@/data';
import type { InventoryItem } from '@/types';
import {
  createDeal,
  dealStats,
  dealTotal,
  expireDeals,
  formatDealEta,
  fulfilDeal,
  isExpired,
  remainingMinutes,
  type Deal,
} from './deals';

const NOW = '2026-03-15T02:00:00.000Z';
const inMinutes = (minutes: number) =>
  new Date(new Date(NOW).getTime() + minutes * 60_000).toISOString();

function deal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: 'd1',
    npcId: 'npc-dal',
    productId: 'product-pill',
    productName: '미상의 알약',
    qty: 3,
    unitPrice: 11_000,
    createdAt: NOW,
    dueAt: inMinutes(120),
    status: 'booked',
    source: { messageId: 'm1', scriptId: 'msg-dal-ask' },
    ...overrides,
  };
}

const stock = (qty: number, productId = 'product-pill'): InventoryItem[] => [
  { id: 'i1', productId, name: '미상의 알약', qty, unitCost: 4_000, marketPrice: 11_000 },
];

describe('booking a deal', () => {
  it('creates a deal priced off the street value', () => {
    const created = createDeal({
      spec: { productId: 'product-pill', qty: 3, dueMinutes: 240 },
      npcId: 'npc-dal',
      messageId: 'm1',
      scriptId: 'msg-dal-ask',
      now: NOW,
      products,
    });

    expect(created).not.toBeNull();
    expect(created?.productName).toBe('미상의 알약');
    expect(created?.unitPrice).toBe(11_000);
    expect(created?.status).toBe('booked');
    expect(remainingMinutes(created!, NOW)).toBe(240);
  });

  it('honours the discount factor', () => {
    const created = createDeal({
      spec: { productId: 'product-powder', qty: 8, dueMinutes: 240, priceFactor: 0.85 },
      npcId: 'npc-boss',
      messageId: 'm1',
      scriptId: 'msg-boss-bulk',
      now: NOW,
      products,
    });
    expect(created?.unitPrice).toBe(Math.round(42_000 * 0.85));
    expect(dealTotal(created!)).toBe(Math.round(42_000 * 0.85) * 8);
  });

  it('refuses unknown products and floors the deadline', () => {
    expect(
      createDeal({
        spec: { productId: 'product-nope', qty: 1, dueMinutes: 10 },
        npcId: 'npc-dal',
        messageId: 'm1',
        scriptId: 's',
        now: NOW,
        products,
      }),
    ).toBeNull();

    const short = createDeal({
      spec: { productId: 'product-pill', qty: 1, dueMinutes: 1 },
      npcId: 'npc-dal',
      messageId: 'm1',
      scriptId: 's',
      now: NOW,
      products,
    });
    expect(remainingMinutes(short!, NOW)).toBeGreaterThanOrEqual(30);
  });
});

describe('delivering a deal', () => {
  it('pays out and removes the stock', () => {
    const result = fulfilDeal(deal(), stock(5));

    expect(result.ok).toBe(true);
    expect(result.cash).toBe(33_000);
    expect(result.inventory[0].qty).toBe(2);
    expect(result.heat).toBe(1);
  });

  it('charges more heat for a big delivery', () => {
    expect(fulfilDeal(deal({ qty: 6 }), stock(9)).heat).toBe(2);
  });

  it('refuses when there is not enough stock', () => {
    const result = fulfilDeal(deal({ qty: 4 }), stock(2));

    expect(result.ok).toBe(false);
    expect(result.error).toContain('미상의 알약');
    expect(result.inventory[0].qty).toBe(2);
    expect(result.cash).toBe(0);
  });

  it('drops empty stacks', () => {
    const result = fulfilDeal(deal({ qty: 5 }), stock(5));
    expect(result.ok).toBe(true);
    expect(result.inventory).toHaveLength(0);
  });

  it('cannot deliver twice', () => {
    const result = fulfilDeal(deal({ status: 'done' }), stock(5));
    expect(result.ok).toBe(false);
  });
});

describe('deadlines', () => {
  it('formats the time left', () => {
    expect(formatDealEta(deal({ dueAt: inMinutes(200) }), NOW)).toBe('3시간 20분 남음');
    expect(formatDealEta(deal({ dueAt: inMinutes(12) }), NOW)).toBe('12분 남음');
    expect(formatDealEta(deal({ dueAt: inMinutes(-5) }), NOW)).toBe('시간 지남');
  });

  it('marks late deals as missed', () => {
    const late = deal({ id: 'late', dueAt: inMinutes(-1) });
    const fine = deal({ id: 'fine', dueAt: inMinutes(60) });
    const { deals, missed } = expireDeals([late, fine], NOW);

    expect(missed.map((entry) => entry.id)).toEqual(['late']);
    expect(deals.find((entry) => entry.id === 'late')?.status).toBe('missed');
    expect(isExpired(deals.find((entry) => entry.id === 'fine')!, NOW)).toBe(false);
  });

  it('counts deals by status', () => {
    const stats = dealStats([
      deal({ id: 'a' }),
      deal({ id: 'b', status: 'done' }),
      deal({ id: 'c', status: 'missed' }),
      deal({ id: 'd', status: 'done' }),
    ]);
    expect(stats).toEqual({ booked: 1, done: 2, missed: 1 });
  });
});
