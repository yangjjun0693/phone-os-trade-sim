/**
 * Deals (약속) — the bridge between the messenger and the trading app.
 *
 * When a customer agrees to meet over the messenger, a *deal* is booked: a
 * product, a quantity, a price and a deadline. The Trade app is where the
 * player actually delivers, so answering messages has a real consequence.
 */
import { nanoid } from 'nanoid';
import { addMinutes } from 'date-fns';
import type { InventoryItem, Place, PlaceKind, Product } from '@/types';
import { patrolLevel, type PatrolLevel } from './patrol';

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
  /** Where the two of them meet. Chosen in the Trade app (미정이면 내 집). */
  placeId?: string;
  /** Where the deal came from, so the UI can explain it. */
  source: { messageId: string; scriptId: string };
}

/** One place the player could meet at, priced in time and patrol risk. */
export interface MeetingOption {
  placeId: string;
  name: string;
  kind: PlaceKind;
  patrol: PatrolLevel;
  /** In-game minutes to get there from home. */
  tripMinutes: number;
  /** Heat added when the meeting actually happens. */
  heatDelta: number;
  /** Chance the meeting is a trap. */
  stingChance: number;
}

const PATROL_STING: Record<PatrolLevel, number> = { low: 0.02, mid: 0.1, high: 0.25 };
const PATROL_HEAT: Record<PatrolLevel, number> = { low: 0, mid: 1, high: 2 };

/** Places you could actually meet at (the police box is not one of them). */
export function meetingOptions(
  places: readonly Place[],
  homePlaceId: string,
  heat: number,
  hour: number,
): MeetingOption[] {
  const home = places.find((place) => place.id === homePlaceId);
  return places
    .filter((place) => place.kind !== 'police')
    .map((place) => {
      const patrol = patrolLevel(place.base, heat, hour, place.nightlife);
      const distance = home
        ? Math.hypot(place.x - home.x, place.y - home.y)
        : 0;
      return {
        placeId: place.id,
        name: place.name,
        kind: place.kind,
        patrol,
        tripMinutes: Math.round(Math.min(45, Math.max(6, distance / 10))),
        heatDelta: PATROL_HEAT[patrol],
        stingChance: PATROL_STING[patrol],
      };
    })
    .sort((a, b) => PATROL_HEAT[a.patrol] - PATROL_HEAT[b.patrol] || a.tripMinutes - b.tripMinutes);
}

export function findMeeting(
  options: readonly MeetingOption[],
  placeId: string | undefined,
): MeetingOption | undefined {
  if (!placeId) return undefined;
  return options.find((option) => option.placeId === placeId);
}

/** Short label for the risk, used in the Trade app. */
export function patrolLabelOf(level: PatrolLevel): string {
  return level === 'low' ? '한산함' : level === 'mid' ? '순찰 있음' : '순찰 잦음';
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
  /** In-game minutes the errand costs (travel included). */
  minutes: number;
  /** The place was watched and the meeting went wrong. */
  stung: boolean;
  message: string;
}

/**
 * Delivers a booked deal out of stock. Cash, heat and the time the errand
 * takes come back to the caller so the store stays the only place that mutates
 * the run. When a meeting place is given, its patrol level decides whether the
 * handover is clean or a trap.
 */
export function fulfilDeal(
  deal: Deal,
  inventory: readonly InventoryItem[],
  meeting?: MeetingOption,
  rng: () => number = Math.random,
): FulfilResult {
  const trip = meeting?.tripMinutes ?? 15;
  const minutes = 20 + trip;
  const bail = (error: string): FulfilResult => ({
    ok: false,
    error,
    inventory: [...inventory],
    cash: 0,
    heat: 0,
    minutes: 0,
    stung: false,
    message: '',
  });

  if (deal.status !== 'booked') return bail('이미 처리된 약속입니다.');

  const stack = inventory.find(
    (item) => item.productId === deal.productId && item.qty >= deal.qty,
  );
  if (!stack) return bail(`${deal.productName} ${deal.qty}개가 필요합니다.`);

  // A watched spot can turn the handover into a trap: the stock is gone and
  // the errand still costs you the walk.
  const watched = meeting ? rng() < meeting.stingChance : false;
  if (watched) {
    const gone = inventory
      .map((item) => (item.id === stack.id ? { ...item, qty: 0 } : item))
      .filter((item) => item.qty > 0);
    return {
      ok: false,
      error: `${meeting?.name ?? '약속 장소'}에 잠복이 있었다. 물량을 통째로 잃었다.`,
      inventory: gone,
      cash: 0,
      heat: 10,
      minutes,
      stung: true,
      message: '',
    };
  }

  const inventory2 = inventory
    .map((item) => (item.id === stack.id ? { ...item, qty: item.qty - deal.qty } : item))
    .filter((item) => item.qty > 0);

  const total = dealTotal(deal);
  const heat = (deal.qty >= 6 ? 2 : 1) + (meeting?.heatDelta ?? 0);
  return {
    ok: true,
    inventory: inventory2,
    cash: total,
    heat,
    minutes,
    stung: false,
    message: `${deal.productName} ${deal.qty}개를 ${meeting ? meeting.name : '약속 장소'}에서 넘겼습니다. (${total.toLocaleString('ko-KR')}원)`,
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
