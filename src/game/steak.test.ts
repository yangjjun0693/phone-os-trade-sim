import { describe, expect, it } from 'vitest';
import {
  COINFLIP_MULTIPLIER,
  MAX_CRASH_POINT,
  MIN_STEAK_BET,
  clampCrashTarget,
  clampDiceTarget,
  crashPoint,
  diceMultiplier,
  diceWinChance,
  resolveSteakBet,
  validateSteakBet,
} from './steak';

describe('steak bets', () => {
  it('validates the stake against the chips on hand', () => {
    expect(validateSteakBet(0, 100)).not.toBeNull();
    expect(validateSteakBet(MIN_STEAK_BET - 1, 100)).not.toBeNull();
    expect(validateSteakBet(10.5, 100)).not.toBeNull();
    expect(validateSteakBet(500, 100)).not.toBeNull();
    expect(validateSteakBet(100, 100)).toBeNull();
  });

  it('pays a winning coin flip at the house-edge multiplier', () => {
    const outcome = resolveSteakBet({ game: 'coinflip', side: 'heads' }, 100, () => 0.1);

    expect(outcome.won).toBe(true);
    expect(outcome.multiplier).toBe(COINFLIP_MULTIPLIER);
    expect(outcome.payout).toBe(196);
    expect(outcome.detail).toContain('앞면');
  });

  it('loses the stake when the coin lands the other way', () => {
    const outcome = resolveSteakBet({ game: 'coinflip', side: 'tails' }, 100, () => 0.1);

    expect(outcome.won).toBe(false);
    expect(outcome.payout).toBe(0);
  });

  it('uses the dice threshold and direction', () => {
    expect(clampDiceTarget(1)).toBe(2);
    expect(clampDiceTarget(200)).toBe(98);
    expect(diceWinChance(25, 'under')).toBe(25);
    expect(diceWinChance(25, 'over')).toBe(75);
    expect(diceMultiplier(50, 'under')).toBe(1.98);

    const under = resolveSteakBet({ game: 'dice', target: 50, direction: 'under' }, 100, () => 0.25);
    expect(under.roll).toBe(25);
    expect(under.won).toBe(true);
    expect(under.payout).toBe(198);

    const over = resolveSteakBet({ game: 'dice', target: 50, direction: 'over' }, 100, () => 0.25);
    expect(over.won).toBe(false);
    expect(over.payout).toBe(0);
  });

  it('turns a uniform draw into a crash point with a house edge', () => {
    expect(crashPoint(() => 0)).toBe(1);
    expect(crashPoint(() => 0.5)).toBe(1.98);
    expect(crashPoint(() => 0.999999)).toBe(MAX_CRASH_POINT);
    expect(clampCrashTarget(0.5)).toBe(1.1);
    expect(clampCrashTarget(500)).toBe(100);

    const justShort = resolveSteakBet({ game: 'crash', target: 2 }, 100, () => 0.5);
    expect(justShort.roll).toBe(1.98);
    expect(justShort.won).toBe(false);
    expect(justShort.payout).toBe(0);

    const win = resolveSteakBet({ game: 'crash', target: 1.5 }, 100, () => 0.5);
    expect(win.won).toBe(true);
    expect(win.payout).toBe(150);
  });
});
