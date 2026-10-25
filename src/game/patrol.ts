import { clamp } from './pricing';

export type PatrolLevel = 'low' | 'mid' | 'high';

/** Night hours: 22:00 - 05:59. */
export function isNightHour(hour: number): boolean {
  return hour >= 22 || hour < 6;
}

/**
 * How closely a spot is watched right now. `base` is the spot's own tendency
 * (0 quiet .. 3 constantly watched); heat and time of day shift it.
 */
export function patrolScore(base: number, heat: number, hour: number, nightlife = false): number {
  let score = base + clamp(heat, 0, 100) / 40;
  if (isNightHour(hour)) score += nightlife ? 0.6 : -0.4;
  return score;
}

export function patrolLevel(base: number, heat: number, hour: number, nightlife = false): PatrolLevel {
  const score = patrolScore(base, heat, hour, nightlife);
  if (score < 1.5) return 'low';
  if (score < 2.5) return 'mid';
  return 'high';
}

export function patrolLabel(level: PatrolLevel): string {
  switch (level) {
    case 'low':
      return '한산함';
    case 'mid':
      return '순찰 있음';
    case 'high':
      return '순찰 잦음';
  }
}
