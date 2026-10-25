/**
 * Deals (약속) — the bridge between the messenger and the trading app.
 *
 * When a customer agrees to meet over the messenger, a *deal* is booked: a
 * product, a quantity, a price and a deadline. The Trade app is where the
 * player actually delivers, so answering messages has a real consequence.
 */
import { nanoid } from 'nanoid';
import { addMinutes } from 'date-fns';
import type { InventoryItem, Product } from '@/types';

export type DealStatus = 'booked' | 'done' | 'missed';

/** What a messenger choice can book. Written in `src/content/messages.ts`. */
export interface BookingSpec {
  productId: string;
  qty: number;
  /** Deadline in game minutes from the moment the deal is made. */
  dueMinutes: number;
  /** Price relative to street value. 1 = 시세, 0.9 = 10% 깎아줌. */
  priceFactor?: number;
}

export interface Deal {
  id: string;
  npcId: string;
  productId: string;
  productName: string;
  qty: number;
  /** What the customer pays per unit. */
  unitPrice: number;
  createdAt: string;
  dueAt: string;
  status: DealStatus;
  /** Where the deal came from, so the UI can explain it. */
  source: { messageId: string; scriptId: string };
}

export interface CreateDealInput {
  spec: BookingSpec;
  npcId: string;
  messageId: string;
  scriptId: string;
  now: string;
  products: readonly Product[];
}

/** Books a deal. Returns `null` when the spec points at an unknown product. */
export function createDeal(input: CreateDealInput): Deal | null {
  const product = input.products.find((entry) => entry.id === input.spec.productId);
  if (!product) return null;

  const qty = Math.max(1, Math.floor(input.spec.qty));
  const factor = input.spec.priceFactor ?? 1;
  return {
    id: `deal-${nanoid(6)}`,
    npcId: input.npcId,
    productId: product.id,
    productName: product.name,
    qty,
    unitPrice: Math.max(1, Math.round(product.street * factor)),
    createdAt: input.now,
    dueAt: addMinutes(new Date(input.now), Math.max(30, input.spec.dueMinutes)).toISOString(),
    status: 'booked',
    source: { messageId: input.messageId, scriptId: input.scriptId },
  };
}

export function dealTotal(deal: Deal): number {
  return Math.round(deal.unitPrice * deal.qty);
}

/** Game minutes left before the customer gives up. Negative once late. */
export function remainingMinutes(deal: Deal, now: string): number {
  return (new Date(deal.dueAt).getTime() - new Date(now).getTime()) / 60_000;
}

export function isExpired(deal: Deal, now: string): boolean {
  return deal.status === 'booked' && remainingMinutes(deal, now) <= 0;
}

/** `"3시간 20분 남음"` / `"12분 남음"` / `"시간 지남"`. */
export function formatDealEta(deal: Deal, now: string): string {
  const minutes = Math.floor(remainingMinutes(deal, now));
  if (minutes <= 0) return '시간 지남';
  const hours = Math.floor(minutes / 60);
  if (hours === 0) return `${minutes}분 남음`;
  return `${hours}시간 ${minutes % 60}분 남음`;
}

/** Marks late deals as missed and tells the caller which ones to punish. */
export function expireDeals(deals: Deal[], now: string): { deals: Deal[]; missed: Deal[] } {
  const missed: Deal[] = [];
  const next = deals.map((deal) => {
    if (!isExpired(deal, now)) return deal;
    const late = { ...deal, status: 'missed' as const };
    missed.push(late);
    return late;
  });
  return { deals: next, missed };
}

export interface FulfilResult {
  ok: boolean;
  error?: string;
  /** Inventory after the sale (unchanged when the sale failed). */
  inventory: InventoryItem[];
  cash: number;
  heat: number;
  message: string;
}

/**
 * Delivers a booked deal out of stock. Cash and heat come back to the caller
 * so the store stays the only place that mutates the run.
 */
export function fulfilDeal(
  deal: Deal,
  inventory: readonly InventoryItem[],
): FulfilResult {
  if (deal.status !== 'booked') {
    return {
      ok: false,
      error: '이미 처리된 약속입니다.',
      inventory: [...inventory],
      cash: 0,
      heat: 0,
      message: '',
    };
  }

  const stack = inventory.find(
    (item) => item.productId === deal.productId && item.qty >= deal.qty,
  );
  if (!stack) {
    return {
      ok: false,
      error: `${deal.productName} ${deal.qty}개가 필요합니다.`,
      inventory: [...inventory],
      cash: 0,
      heat: 0,
      message: '',
    };
  }

  const inventory2 = inventory
    .map((item) => (item.id === stack.id ? { ...item, qty: item.qty - deal.qty } : item))
    .filter((item) => item.qty > 0);

  const total = dealTotal(deal);
  return {
    ok: true,
    inventory: inventory2,
    cash: total,
    heat: deal.qty >= 6 ? 2 : 1,
    message: `${deal.productName} ${deal.qty}개를 약속대로 넘겼습니다. (${total.toLocaleString('ko-KR')}원)`,
  };
}

/** Progress line for the Trade app header. */
export function dealStats(deals: readonly Deal[]): { booked: number; done: number; missed: number } {
  return deals.reduce(
    (acc, deal) => {
      acc[deal.status] += 1;
      return acc;
    },
    { booked: 0, done: 0, missed: 0 } as { booked: number; done: number; missed: number },
  );
}
