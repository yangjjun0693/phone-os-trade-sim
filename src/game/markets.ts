import type { Clue, MarketReach, MarketSite, MarketStatus } from '@/types';
import { clamp, round2 } from './pricing';

/** The three browsers, each with its own reach onto the network. */
export type BrowserId = 'chroma' | 'sailor' | 'shade';

export type AccessReason = 'blocked-onion' | 'server-not-found' | 'invite-required';

export type AccessResult = { ok: true } | { ok: false; reason: AccessReason };

/**
 * Can this browser open this site?
 *
 * - Chroma (clearnet) cannot route to the onion network at all.
 * - Sailor (mirror) reaches clearnet and mirrors, but not the onion originals.
 * - Shade (Tor) reaches everything, but onion addresses must have been found
 *   first (via the social apps) and invite-only sites need an invite.
 */
export function browserAccess(
  market: MarketSite,
  browser: BrowserId,
  discovered: readonly string[] = [],
): AccessResult {
  if (browser === 'chroma') {
    return market.reach === 'clearnet' ? { ok: true } : { ok: false, reason: 'blocked-onion' };
  }
  if (browser === 'sailor') {
    return market.reach === 'onion'
      ? { ok: false, reason: 'server-not-found' }
      : { ok: true };
  }
  // shade
  if (market.reach === 'onion' && !discovered.includes(market.id)) {
    return { ok: false, reason: market.invite ? 'invite-required' : 'server-not-found' };
  }
  return { ok: true };
}

/** Sites a browser lists on its start page / shortcuts. */
export function listedMarkets(
  all: readonly MarketSite[],
  browser: BrowserId,
  discovered: readonly string[] = [],
): MarketSite[] {
  return all.filter((market) => {
    if (browser === 'chroma') return market.reach === 'clearnet';
    if (browser === 'sailor') return market.reach !== 'onion';
    return market.reach !== 'onion' || discovered.includes(market.id);
  });
}

export function reachLabel(reach: MarketReach): string {
  switch (reach) {
    case 'clearnet':
      return '일반';
    case 'mirror':
      return '미러';
    case 'onion':
      return '다크넷';
  }
}

/** One-line explanation of what a browser can and cannot reach. */
export function browserReachHint(browser: BrowserId): string {
  switch (browser) {
    case 'chroma':
      return '일반 인터넷만 접속할 수 있습니다. .onion 주소는 차단됩니다.';
    case 'sailor':
      return '미러 사이트까지 접속됩니다. 원본 .onion은 열리지 않고, 방문 기록이 남습니다.';
    case 'shade':
      return '다크넷 전체에 접속됩니다. 느리고 불안정하지만 가장 싸고 물량이 많습니다.';
  }
}

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
