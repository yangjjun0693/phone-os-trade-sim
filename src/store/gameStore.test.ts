import { beforeEach, describe, expect, it } from 'vitest';
import { GAME_EPOCH, useGameStore } from './gameStore';

beforeEach(() => {
  useGameStore.setState({
    cash: 1_500_000,
    heat: 12,
    day: 1,
    gameDateTime: GAME_EPOCH,
    inventory: [],
    bank: { balance: 8_200_000, transactions: [] },
  });
});

describe('gameStore', () => {
  it('never lets cash drop below zero', () => {
    useGameStore.getState().addCash(-99_999_999);
    expect(useGameStore.getState().cash).toBe(0);
  });

  it('clamps heat into 0..100', () => {
    useGameStore.getState().addHeat(500);
    expect(useGameStore.getState().heat).toBe(100);

    useGameStore.getState().addHeat(-500);
    expect(useGameStore.getState().heat).toBe(0);
  });

  it('advances the in-game clock by whole minutes', () => {
    useGameStore.getState().advanceGameTime(30);
    expect(useGameStore.getState().gameDateTime).toBe('2026-03-14T22:17:00.000Z');
  });

  it('moves cash into the bank and back', () => {
    const deposit = useGameStore.getState().bankDeposit(200_000);
    expect(deposit.ok).toBe(true);
    expect(useGameStore.getState().cash).toBe(1_300_000);
    expect(useGameStore.getState().bank.balance).toBe(8_400_000);

    const withdraw = useGameStore.getState().bankWithdraw(400_000);
    expect(withdraw.ok).toBe(true);
    expect(useGameStore.getState().cash).toBe(1_700_000);
    expect(useGameStore.getState().bank.balance).toBe(8_000_000);
  });

  it('rejects deposits larger than the cash on hand', () => {
    const result = useGameStore.getState().bankDeposit(99_999_999);
    expect(result.ok).toBe(false);
    expect(useGameStore.getState().cash).toBe(1_500_000);
  });

  it('a large deposit is flagged and raises heat', () => {
    const result = useGameStore.getState().bankDeposit(1_000_000);
    expect(result.flagged).toBe(true);
    expect(useGameStore.getState().heat).toBeGreaterThan(12);
    expect(useGameStore.getState().bank.transactions[0].flagged).toBe(true);
  });
});
