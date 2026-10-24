/**
 * Pure pricing helpers. No React, no store, no side effects — safe to unit test
 * and to reuse from a future simulation loop.
 *
 * NOTE: this is fiction. Values model a game economy, not a real one.
 */
export interface PriceInput {
  /** Negotiated base price for a single unit. */
  basePrice: number;
  /** 0–100 police attention gauge. */
  heat: number;
  /** -1 (no buyers) .. 1 (desperate buyers). */
  demand: number;
  /** Number of units in the order. */
  bulkQty?: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Risky times raise prices: 0 heat = 1.0x, 100 heat = 1.5x. */
export function riskMultiplier(heat: number): number {
  return 1 + clamp(heat, 0, 100) / 200;
}

/** Bulk orders get up to a 30% discount. */
export function bulkDiscount(bulkQty: number): number {
  return Math.min(0.3, Math.max(0, bulkQty - 1) * 0.02);
}

export function computeUnitPrice({ basePrice, heat, demand, bulkQty = 1 }: PriceInput): number {
  const demandFactor = 1 + clamp(demand, -1, 1) * 0.25;
  return round2(basePrice * riskMultiplier(heat) * demandFactor * (1 - bulkDiscount(bulkQty)));
}

export function computeOrderTotal(input: PriceInput): number {
  const qty = Math.max(1, Math.floor(input.bulkQty ?? 1));
  return round2(computeUnitPrice(input) * qty);
}
