import type { RiskTier } from '@/types';
import { HEAT_CASH_MAX, HEAT_CASH_PER_STEP, HEAT_CASH_SAFE } from '@/content/economy';
import { clamp, round2 } from './pricing';

/** Soft cap for the heat gauge. */
export const HEAT_MAX = 100;

export function heatTier(heat: number): RiskTier {
  const value = clamp(heat, 0, HEAT_MAX);
  if (value < 25) return 'calm';
  if (value < 50) return 'watched';
  if (value < 80) return 'hot';
  return 'burned';
}

/**
 * Holding a lot of cash is itself a risk: storage, theft and stop-and-search.
 * Returns extra heat points contributed purely by the current wallet.
 */
export function heatFromCash(cash: number): number {
  if (cash <= HEAT_CASH_SAFE) return 0;
  return Math.floor(
    clamp((cash - HEAT_CASH_SAFE) / HEAT_CASH_PER_STEP, 0, HEAT_CASH_MAX),
  );
}

/** Heat naturally cools while the player keeps a low profile. */
export function decayHeat(heat: number, hours: number): number {
  const cooled = clamp(heat, 0, HEAT_MAX) - Math.max(0, hours) * 0.75;
  return round2(clamp(cooled, 0, HEAT_MAX));
}

export function heatLabel(tier: RiskTier): string {
  switch (tier) {
    case 'calm':
      return '조용함';
    case 'watched':
      return '관찰 중';
    case 'hot':
      return '수색 위험';
    case 'burned':
      return '추적당하는 중';
  }
}
