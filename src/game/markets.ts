import type { Clue, MarketSite, MarketStatus } from '@/types';
import { clamp, round2 } from './pricing';

/** Only genuinely honest sites should be treated as safe — and even then, caution. */
export function isTrustworthy(status: MarketStatus): boolean {
  return status === 'legit';
}

export function describeStatus(status: MarketStatus): string {
  switch (status) {
    case 'legit':
      return '정상으로 보임';
    case 'scam':
      return '사기 정황';
    case 'honeypot':
      return '함정 정황';
    case 'closing':
      return '곧 폐쇄 예정';
  }
}

/**
 * Heuristic 0–100 score derived from *readable* clues. Some clues are noise, so
 * a high score is a hint, never a verdict — this is the core of the game.
 */
export function suspicionScore(site: MarketSite, clues: Clue[]): number {
  const relevant = clues.filter((clue) => clue.marketId === site.id);
  if (relevant.length === 0) return 30;

  const reliable = relevant.filter((clue) => clue.reliable).length;
  const noise = relevant.length - reliable;

  const agePenalty = site.openedDaysAgo < 7 ? 15 : 0;
  const statusPenalty =
    site.status === 'honeypot' ? 40 : site.status === 'scam' ? 25 : site.status === 'closing' ? 10 : 0;
  const traitPenalty = site.traits.length * 3;

  const raw = 20 + statusPenalty + agePenalty + traitPenalty + (noise - reliable) * 6;
  return round2(clamp(raw, 0, 100));
}
