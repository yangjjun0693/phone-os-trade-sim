import { nanoid } from 'nanoid';
import type { CustomerKind, NpcProfile } from '@/types';
import { clamp } from './pricing';

export interface Customer {
  id: string;
  profileId: string;
  kind: CustomerKind;
  /** 0–100. At 0 the customer walks away. */
  patience: number;
  /** 0–1. How much of a discount they will push for. */
  haggling: number;
}

export type Rng = () => number;

/** Higher heat means undercover officers are likelier to show up. */
export function rollCustomerKind(rng: Rng, heat: number): CustomerKind {
  const undercoverChance = 0.05 + clamp(heat, 0, 100) / 400;
  const difficultChance = 0.3;
  const roll = rng();
  if (roll < undercoverChance) return 'undercover';
  if (roll < undercoverChance + difficultChance) return 'difficult';
  return 'regular';
}

export function createCustomer(profile: NpcProfile, rng: Rng = Math.random): Customer {
  return {
    id: nanoid(8),
    profileId: profile.id,
    kind: profile.kind,
    patience: Math.round(40 + rng() * 60),
    haggling: Math.round(rng() * 100) / 100,
  };
}
