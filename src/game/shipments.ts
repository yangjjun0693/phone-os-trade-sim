/**
 * Shipments — the logistics step between buying and owning stock.
 *
 * Buying from a market no longer drops goods straight into the player's
 * pockets: the lot travels to a chosen address, costs a fee, and can be
 * seized or lost on the way. 구팡 (the parcel app) is where it is collected.
 */
import { nanoid } from 'nanoid';
import { addHours } from 'date-fns';
import {
  DEFAULT_ADDRESS,
  findAddress,
  type AddressOption,
  type DropAddress,
} from '@/content/logistics';
import type { Rng } from './customers';
import { clamp } from './pricing';

export type ShipmentStatus = 'in_transit' | 'arrived' | 'collected' | 'seized' | 'lost';

export interface Shipment {
  id: string;
  marketId: string;
  productId: string;
  productName: string;
  qty: number;
  /** What the player paid per unit. */
  unitCost: number;
  /** Street value, carried into inventory on collection. */
  marketPrice: number;
  address: DropAddress;
  fee: number;
  orderedAt: string;
  etaAt: string;
  status: ShipmentStatus;
  /** Short line shown in 구팡 (why it is late / gone). */
  note?: string;
}

export const SHIPMENT_LABEL: Record<ShipmentStatus, string> = {
  in_transit: '배송 중',
  arrived: '수령 대기',
  collected: '수령 완료',
  seized: '압수됨',
  lost: '분실',
};

export interface CreateShipmentInput {
  marketId: string;
  productId: string;
  productName: string;
  qty: number;
  unitCost: number;
  marketPrice: number;
  address?: DropAddress;
  now: string;
}

export function addressOf(address?: DropAddress): AddressOption {
  return findAddress(address ?? DEFAULT_ADDRESS);
}

export function shippingFee(address?: DropAddress): number {
  return addressOf(address).fee;
}

export function createShipment(
  input: CreateShipmentInput,
  rng: Rng = Math.random,
): Shipment {
  const option = addressOf(input.address);
  // A small wobble so two orders in the same minute do not land identically.
  const hours = option.hours + Math.round((rng() - 0.5) * 2);
  return {
    id: `ship-${nanoid(6)}`,
    marketId: input.marketId,
    productId: input.productId,
    productName: input.productName,
    qty: Math.max(1, Math.floor(input.qty)),
    unitCost: input.unitCost,
    marketPrice: input.marketPrice,
    address: option.id,
    fee: option.fee,
    orderedAt: input.now,
    etaAt: addHours(new Date(input.now), hours).toISOString(),
    status: 'in_transit',
  };
}

export function minutesUntilArrival(shipment: Shipment, now: string): number {
  return (new Date(shipment.etaAt).getTime() - new Date(now).getTime()) / 60_000;
}

/** `"3시간 20분 남음"` / `"12분 남음"` / `"도착"`. */
export function formatShipmentEta(shipment: Shipment, now: string): string {
  const minutes = Math.floor(minutesUntilArrival(shipment, now));
  if (minutes <= 0) return '도착';
  const hours = Math.floor(minutes / 60);
  if (hours === 0) return `${minutes}분 남음`;
  return `${hours}시간 ${minutes % 60}분 남음`;
}

/**
 * Rolls what actually happens when a parcel lands: normally it arrives, but a
 * watched address can lose it to a seizure, and a drop can simply vanish.
 */
export function rollShipmentArrival(shipment: Shipment, rng: Rng = Math.random): Shipment {
  const option = addressOf(shipment.address);
  const roll = rng();

  if (roll < option.seizeChance) {
    return { ...shipment, status: 'seized', note: '통관·검문에서 걸렸습니다. 물량을 잃었습니다.' };
  }
  if (roll < option.seizeChance + option.loseChance) {
    return { ...shipment, status: 'lost', note: '드롭 장소에서 물건이 사라졌습니다.' };
  }
  return { ...shipment, status: 'arrived', note: undefined };
}

export interface AdvanceResult {
  shipments: Shipment[];
  /** Shipments that landed this tick, for notifications and heat. */
  landed: Shipment[];
}

/** Moves every due parcel to its rolled outcome. */
export function advanceShipments(
  shipments: readonly Shipment[],
  now: string,
  rng: Rng = Math.random,
): AdvanceResult {
  const landed: Shipment[] = [];
  const next = shipments.map((shipment) => {
    if (shipment.status !== 'in_transit') return shipment;
    if (minutesUntilArrival(shipment, now) > 0) return shipment;
    const resolved = rollShipmentArrival(shipment, rng);
    landed.push(resolved);
    return resolved;
  });
  return { shipments: next, landed };
}

/** Heat added when a parcel lands at its address. */
export function arrivalHeat(shipment: Shipment): number {
  return clamp(addressOf(shipment.address).heat, 0, 100);
}

export function shipmentTotals(shipments: readonly Shipment[]) {
  return shipments.reduce(
    (acc, shipment) => {
      acc[shipment.status] += 1;
      return acc;
    },
    { in_transit: 0, arrived: 0, collected: 0, seized: 0, lost: 0 } as Record<
      ShipmentStatus,
      number
    >,
  );
}
