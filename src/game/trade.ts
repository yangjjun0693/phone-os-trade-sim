/**
 * The core trading loop, kept pure so the economy can be tested without React.
 *
 * Everything here is fiction: made-up goods, made-up prices, made-up risk.
 * The player buys lots from grey-market sites, sells them to generated
 * customers, and closes the day to pay rent, roll an event and cool down heat.
 */
import { nanoid } from 'nanoid';
import type {
  CustomerKind,
  InventoryItem,
  MarketReach,
  MarketSite,
  MarketStatus,
  NpcProfile,
  Product,
} from '@/types';
import {
  DAY_END_HEAT_DECAY_HOURS,
  HEAT_UNPAID_RENT,
  MAX_DAYS,
  RENT_BASE,
  RENT_STEP,
  RENT_STEP_MAX_DAY,
  RETIRE_GOAL,
} from '@/content/economy';
import { clamp, computeUnitPrice, round2 } from './pricing';
import { decayHeat, heatFromCash } from './heat';
import { rollCustomerKind, type Rng } from './customers';
import { rollEvent, type GameEvent } from './events';

export type GameStatus = 'playing' | 'busted' | 'retired';

// Balance values live in `src/content/economy.ts`; re-exported here so the game
// layer keeps one import surface (`@/game`).
export {
  DAY_END_HEAT_DECAY_HOURS,
  MAX_DAYS,
  RENT_BASE,
  RENT_STEP,
  RETIRE_GOAL,
};

/** Deterministic RNG so a market's stock is stable for the whole in-game day. */
export function createSeededRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const PRICE_FACTOR: Record<MarketStatus, number> = {
  legit: 1,
  scam: 0.55,
  honeypot: 0.7,
  closing: 0.85,
};

/**
 * Lot size range per network layer. This is the real difference between the
 * browsers: clearnet shops only sell small amounts, the onion layer sells
 * wholesale. Bigger lots mean more profit per action (and actions cost time).
 */
const OFFER_QTY: Record<MarketReach, [number, number]> = {
  clearnet: [4, 8],
  mirror: [6, 12],
  onion: [10, 25],
};

/**
 * Street prices move every day. Deterministic per product + day, so the market
 * does not reroll while the player is looking at it — only when the day turns.
 */
export function priceDrift(productId: string, day: number): number {
  const rng = createSeededRng(hashString(`${productId}:${day}:drift`));
  return round2(0.9 + rng() * 0.2);
}

/**
 * How much a customer pays relative to street value. Trust 20 (a fresh run) is
 * the neutral point: strangers pay a little under street, known faces over it.
 */
export function trustMultiplier(trust = 20): number {
  return round2(0.95 + (clamp(trust, 0, 100) / 100) * 0.2);
}

export interface MarketOffer {
  id: string;
  marketId: string;
  productId: string;
  name: string;
  qty: number;
  /** What the market charges per unit. */
  unitPrice: number;
  /** Street value for today, carried into inventory on delivery. */
  marketPrice: number;
  wholesale: number;
  /** Today's street-price multiplier (0.90–1.10) for the UI. */
  drift: number;
}

/**
 * Two rotating lots per market per day. Same market + day always returns the
 * same stock, so reopening the browser does not reroll a good deal.
 */
export function generateMarketOffers(
  market: MarketSite,
  products: Product[],
  day: number,
): MarketOffer[] {
  if (products.length === 0) return [];
  const rng = createSeededRng(hashString(`${market.id}:${day}:offers`));
  const used = new Set<number>();
  const offers: MarketOffer[] = [];

  for (let slot = 0; slot < 2; slot += 1) {
    let index = Math.floor(rng() * products.length) % products.length;
    if (used.has(index)) index = (index + 1) % products.length;
    used.add(index);

    const product = products[index];
    const [qtyMin, qtyMax] = OFFER_QTY[market.reach] ?? OFFER_QTY.mirror;
    const qty = qtyMin + Math.floor(rng() * (qtyMax - qtyMin + 1));
    const jitter = 0.9 + rng() * 0.2;
    const unitPrice = Math.max(
      1,
      Math.round(
        product.wholesale * PRICE_FACTOR[market.status] * (market.priceMod ?? 1) * jitter,
      ),
    );

    const drift = priceDrift(product.id, day);
    offers.push({
      id: `${market.id}:${day}:${slot}`,
      marketId: market.id,
      productId: product.id,
      name: product.name,
      qty,
      unitPrice,
      marketPrice: Math.max(1, Math.round(product.street * drift)),
      wholesale: product.wholesale,
      drift,
    });
  }

  return offers;
}

export type PurchaseKind = 'delivered' | 'scammed' | 'honeypot' | 'closed';

export interface PurchaseOutcome {
  kind: PurchaseKind;
  /** Cash actually spent (the whole lot is always paid up front). */
  spent: number;
  deliveredQty: number;
  heatDelta: number;
  message: string;
  /** A honeypot order means someone was watching the drop. */
  sting: boolean;
}

/** Resolve a buy against the site's hidden behaviour. */
export function resolvePurchase(
  offer: MarketOffer,
  status: MarketStatus,
  rng: Rng = Math.random,
): PurchaseOutcome {
  const spent = round2(offer.unitPrice * offer.qty);

  switch (status) {
    case 'legit':
      return {
        kind: 'delivered',
        spent,
        deliveredQty: offer.qty,
        heatDelta: 1,
        message: '주문이 도착했습니다. 포장은 지나치게 평범합니다.',
        sting: false,
      };
    case 'scam': {
      const sample = rng() < 0.12;
      return {
        kind: 'scammed',
        spent,
        deliveredQty: sample ? Math.max(1, Math.floor(offer.qty / 3)) : 0,
        heatDelta: sample ? 1 : 2,
        message: sample
          ? '돈을 보냈더니 수량의 일부만 담긴 봉투가 왔다. 나머지는 사라졌다.'
          : '입금 후 판매자가 사라졌다. 메시지는 읽지도 않는다.',
        sting: false,
      };
    }
    case 'honeypot': {
      const delivered = rng() < 0.35;
      return {
        kind: 'honeypot',
        spent,
        deliveredQty: delivered ? offer.qty : 0,
        heatDelta: 22,
        message: delivered
          ? '물건은 왔지만 주소가 함정이었던 것 같다. 누군가 지켜보는 느낌이 든다.'
          : '거래가 성사되는 순간 누군가 들이닥쳤다. 가까스로 빠져나왔다.',
        sting: true,
      };
    }
    case 'closing': {
      const delivered = rng() < 0.55;
      return {
        kind: 'closed',
        spent,
        deliveredQty: delivered ? offer.qty : 0,
        heatDelta: delivered ? 1 : 3,
        message: delivered
          ? '폐쇄 직전 마지막 배송이 도착했다. 다시 연락은 없을 것이다.'
          : '사이트가 폐쇄됐다. 돈만 남기고 사라졌다.',
        sting: false,
      };
    }
  }
}

export interface InventoryAdd {
  productId?: string;
  name: string;
  qty: number;
  unitCost: number;
  marketPrice?: number;
}

/** Merge a delivery into a stack, keeping a weighted average unit cost. */
export function addToInventory(
  inventory: InventoryItem[],
  add: InventoryAdd,
): InventoryItem[] {
  const qty = Math.max(0, Math.floor(add.qty));
  if (qty === 0) return inventory;

  const existing = inventory.find(
    (item) =>
      (add.productId ? item.productId === add.productId : false) || item.name === add.name,
  );

  if (!existing) {
    return [
      ...inventory,
      {
        id: `item-${nanoid(6)}`,
        productId: add.productId,
        name: add.name,
        qty,
        unitCost: add.unitCost,
        marketPrice: add.marketPrice,
      },
    ];
  }

  const totalQty = existing.qty + qty;
  const unitCost = round2(
    (existing.unitCost * existing.qty + add.unitCost * qty) / totalQty,
  );

  return inventory.map((item) =>
    item.id === existing.id
      ? {
          ...item,
          qty: totalQty,
          unitCost,
          marketPrice: add.marketPrice ?? item.marketPrice,
        }
      : item,
  );
}

/** Remove sold stock and drop empty stacks. */
export function removeFromInventory(
  inventory: InventoryItem[],
  itemId: string,
  qty: number,
): InventoryItem[] {
  return inventory
    .map((item) =>
      item.id === itemId ? { ...item, qty: item.qty - Math.max(0, qty) } : item,
    )
    .filter((item) => item.qty > 0);
}

export interface CustomerOffer {
  id: string;
  profileId: string;
  name: string;
  kind: CustomerKind;
  itemId: string;
  itemName: string;
  qty: number;
  unitPrice: number;
  total: number;
  /** 0–100. Negotiation burns patience; at 0 the customer leaves. */
  patience: number;
  bio: string;
}

/** Behavioural tell shown before the player commits. Never a verdict. */
export function customerKindHint(kind: CustomerKind): string {
  switch (kind) {
    case 'regular':
      return '편하게 굴고, 값을 크게 따지지 않는다.';
    case 'difficult':
      return '계속 값을 깎으려 들고, 계산이 빠르다.';
    case 'undercover':
      return '말투가 지나치게 정중하고, 질문이 많다.';
  }
}

/** Build a buyer for a random stack in the player's inventory. */
export function createCustomerOffer(
  inventory: InventoryItem[],
  npcs: NpcProfile[],
  heat: number,
  rng: Rng = Math.random,
  trust = 20,
): CustomerOffer | null {
  const available = inventory.filter((item) => item.qty > 0);
  if (available.length === 0 || npcs.length === 0) return null;

  const item = available[Math.floor(rng() * available.length) % available.length];
  const maxQty = Math.max(1, Math.min(6, item.qty));
  const qty = 1 + Math.floor(rng() * maxQty);
  const kind = rollCustomerKind(rng, heat);
  const profile = npcs[Math.floor(rng() * npcs.length) % npcs.length];

  // Regulars pay a little better as trust builds; strangers pay below street.
  const basePrice =
    (item.marketPrice ?? item.unitCost * 2.4) *
    (0.9 + rng() * 0.2) *
    trustMultiplier(trust);
  const demand = kind === 'difficult' ? -0.5 : kind === 'undercover' ? 0.2 : 0.1;
  const unitPrice = Math.max(
    1,
    Math.round(computeUnitPrice({ basePrice, heat, demand, bulkQty: qty })),
  );

  return {
    id: nanoid(8),
    profileId: profile.id,
    name: profile.name,
    kind,
    itemId: item.id,
    itemName: item.name,
    qty,
    unitPrice,
    total: Math.round(unitPrice * qty),
    patience: Math.round(40 + rng() * 60),
    bio: profile.bio,
  };
}

export const COUNTER_MARKUP = 0.18;

export interface CounterResult {
  accepted: boolean;
  unitPrice: number;
  total: number;
  message: string;
}

/** Ask for ~18% more. Greedy or impatient buyers walk away. */
export function resolveCounter(
  offer: CustomerOffer,
  rng: Rng = Math.random,
): CounterResult {
  const unitPrice = Math.round(offer.unitPrice * (1 + COUNTER_MARKUP));
  const total = Math.round(unitPrice * offer.qty);
  const chance =
    offer.kind === 'regular' ? 0.55 : offer.kind === 'difficult' ? 0.25 : 0.95;
  const patienceBonus = (clamp(offer.patience, 0, 100) - 50) / 500;
  const accepted = rng() < clamp(chance + patienceBonus, 0.05, 0.95);

  return {
    accepted,
    unitPrice,
    total,
    message: accepted
      ? `손님이 ${unitPrice.toLocaleString('ko-KR')}원에 넘어왔다.`
      : '손님이 고개를 젓고 돌아섰다. 협상은 결렬됐다.',
  };
}

export interface DayEndInput {
  day: number;
  cash: number;
  heat: number;
  bankBalance: number;
}

export interface DayReport {
  day: number;
  rent: number;
  paidFromCash: number;
  paidFromBank: number;
  unpaidRent: number;
  event: GameEvent | null;
  heatBefore: number;
  heatAfter: number;
  cashBefore: number;
  cashAfter: number;
  bankAfter: number;
  totalWealth: number;
  status: GameStatus;
  reason: string;
}

/** Close the day: rent, a random event, cooling off, then win/lose checks. */
export function resolveDayEnd(
  input: DayEndInput,
  rng: Rng = Math.random,
): DayReport {
  const rent = RENT_BASE + Math.min(RENT_STEP_MAX_DAY, input.day) * RENT_STEP;

  const paidFromCash = Math.min(Math.max(0, input.cash), rent);
  let cash = input.cash - paidFromCash;
  let bank = input.bankBalance;
  const paidFromBank = Math.min(Math.max(0, bank), rent - paidFromCash);
  bank -= paidFromBank;
  const unpaidRent = rent - paidFromCash - paidFromBank;

  const event = rollEvent(rng, 0.4);
  cash += event?.cashDelta ?? 0;
  cash = Math.max(0, cash);

  let heat = decayHeat(input.heat, DAY_END_HEAT_DECAY_HOURS);
  heat += event?.heatDelta ?? 0;
  if (unpaidRent > 0) heat += HEAT_UNPAID_RENT;
  heat += Math.ceil(heatFromCash(cash) / 2);
  heat = Math.round(clamp(heat, 0, 100));

  const totalWealth = Math.round(cash + bank);

  let status: GameStatus = 'playing';
  let reason = '';

  if (totalWealth >= RETIRE_GOAL) {
    status = 'retired';
    reason = `현금과 예금을 합쳐 ₩${totalWealth.toLocaleString('ko-KR')}을 만들었다. 이제 이 생활을 접을 수 있다.`;
  } else if (heat >= 100) {
    status = 'busted';
    reason = '결국 추적망에 걸렸다. 문을 두드리는 소리가 들린다.';
  } else if (input.day >= MAX_DAYS) {
    status = 'busted';
    reason = `${MAX_DAYS}일이 지났다. 목표 금액에 닿지 못했고, 더 버틸 시간도 없다.`;
  }

  return {
    day: input.day,
    rent,
    paidFromCash,
    paidFromBank,
    unpaidRent,
    event,
    heatBefore: input.heat,
    heatAfter: heat,
    cashBefore: input.cash,
    cashAfter: Math.round(cash),
    bankAfter: Math.round(bank),
    totalWealth,
    status,
    reason,
  };
}

/** Combined net worth shown in the HUD and used for the win check. */
export function totalWealth(cash: number, bankBalance: number): number {
  return Math.round(cash + bankBalance);
}
