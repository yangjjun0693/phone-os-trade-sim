/**
 * steak — a fictional crypto-casino parody. Every chip is game currency.
 *
 * The resolver returns the *total* payout (stake included), so the store only
 * has to subtract the stake and add the payout. The house edge is baked into
 * the multipliers; nothing here touches real money, crypto or real gambling.
 */

export type SteakGameId = 'coinflip' | 'dice' | 'crash';
export type CoinSide = 'heads' | 'tails';
export type DiceDirection = 'under' | 'over';

export const STEAK_HOUSE_EDGE = 0.01;
export const MIN_STEAK_BET = 10;
export const MAX_STEAK_BET = 100_000;
export const COINFLIP_MULTIPLIER = 1.96;
export const MAX_CRASH_POINT = 1_000;
export const MIN_CRASH_TARGET = 1.1;
export const MAX_CRASH_TARGET = 100;

export interface CoinFlipBet {
  game: 'coinflip';
  side: CoinSide;
}

export interface DiceBet {
  game: 'dice';
  /** Winning threshold between 2 and 98. */
  target: number;
  direction: DiceDirection;
}

export interface CrashBet {
  game: 'crash';
  /** Cash-out multiplier, e.g. 2 means "win if the crash point reaches 2.00x". */
  target: number;
}

export type SteakBet = CoinFlipBet | DiceBet | CrashBet;

export interface SteakOutcome {
  game: SteakGameId;
  won: boolean;
  /** Amount the player put at risk. */
  stake: number;
  /** Total returned to the player, stake included. Zero on a loss. */
  payout: number;
  /** Multiplier that applies on a win. */
  multiplier: number;
  /** Human-readable line for the result card. */
  detail: string;
  /** Raw draw: 0/1 for coinflip, 0–99.99 for dice, the crash point for crash. */
  roll: number;
}

/** Validates a stake against the chips on hand. Returns an error message or null. */
export function validateSteakBet(amount: number, chips: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return '베팅 금액을 입력해 주세요.';
  if (!Number.isInteger(amount)) return '칩 단위로 입력해 주세요.';
  if (amount < MIN_STEAK_BET) return `최소 ${MIN_STEAK_BET}칩부터 베팅할 수 있습니다.`;
  if (amount > MAX_STEAK_BET) {
    return `최대 ${MAX_STEAK_BET.toLocaleString('ko-KR')}칩까지 베팅할 수 있습니다.`;
  }
  if (amount > chips) return '보유 칩이 부족합니다.';
  return null;
}

export function clampDiceTarget(target: number): number {
  return Math.min(98, Math.max(2, Math.round(target)));
}

/** Percentage chance of winning for a dice threshold. */
export function diceWinChance(target: number, direction: DiceDirection): number {
  const clamped = clampDiceTarget(target);
  return direction === 'under' ? clamped : 100 - clamped;
}

/** Payout multiplier for a dice threshold, with the house edge applied. */
export function diceMultiplier(target: number, direction: DiceDirection): number {
  const chance = diceWinChance(target, direction);
  const raw = (100 - STEAK_HOUSE_EDGE * 100) / chance;
  return Math.round(raw * 100) / 100;
}

export function clampCrashTarget(target: number): number {
  const clamped = Math.min(MAX_CRASH_TARGET, Math.max(MIN_CRASH_TARGET, target));
  return Math.round(clamped * 100) / 100;
}

/**
 * Crash point from a uniform random draw. P(crash >= target) ≈ 0.99 / target,
 * so the expected return is just under the stake (the house edge).
 */
export function crashPoint(random: () => number = Math.random): number {
  const draw = Math.min(0.999999, Math.max(0, random()));
  const raw = (1 - STEAK_HOUSE_EDGE) / (1 - draw);
  return Math.min(MAX_CRASH_POINT, Math.max(1, Math.floor(raw * 100) / 100));
}

/** Resolves one bet. `random` is injectable so the logic is deterministic in tests. */
export function resolveSteakBet(
  bet: SteakBet,
  amount: number,
  random: () => number = Math.random,
): SteakOutcome {
  switch (bet.game) {
    case 'coinflip': {
      const heads = random() < 0.5;
      const won = (bet.side === 'heads') === heads;
      return {
        game: 'coinflip',
        won,
        stake: amount,
        payout: won ? Math.round(amount * COINFLIP_MULTIPLIER) : 0,
        multiplier: COINFLIP_MULTIPLIER,
        detail: `${heads ? '앞면' : '뒷면'}이 나왔습니다.`,
        roll: heads ? 1 : 0,
      };
    }
    case 'dice': {
      const target = clampDiceTarget(bet.target);
      const roll = Math.floor(Math.min(0.9999, Math.max(0, random())) * 10_000) / 100;
      const won = bet.direction === 'under' ? roll < target : roll > target;
      const multiplier = diceMultiplier(target, bet.direction);
      return {
        game: 'dice',
        won,
        stake: amount,
        payout: won ? Math.round(amount * multiplier) : 0,
        multiplier,
        detail: `굴림 ${roll.toFixed(2)} · 기준 ${target} ${bet.direction === 'under' ? '미만' : '초과'}`,
        roll,
      };
    }
    case 'crash': {
      const target = clampCrashTarget(bet.target);
      const roll = crashPoint(random);
      const won = roll >= target;
      return {
        game: 'crash',
        won,
        stake: amount,
        payout: won ? Math.round(amount * target) : 0,
        multiplier: target,
        detail: `크래시 ${roll.toFixed(2)}x · 목표 ${target.toFixed(2)}x`,
        roll,
      };
    }
  }
}
