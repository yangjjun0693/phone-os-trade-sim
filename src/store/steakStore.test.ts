import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME_EPOCH, useGameStore } from './gameStore';

beforeEach(() => {
  useGameStore.setState({
    playerName: '이지훈',
    cash: 1240,
    gameDateTime: GAME_EPOCH,
    steak: { chips: 5000, bets: [] },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('steak store', () => {
  it('moves cash into chips and back', () => {
    expect(useGameStore.getState().steakDeposit(200).ok).toBe(true);
    expect(useGameStore.getState().cash).toBe(1040);
    expect(useGameStore.getState().steak.chips).toBe(5200);

    expect(useGameStore.getState().steakWithdraw(500).ok).toBe(true);
    expect(useGameStore.getState().cash).toBe(1540);
    expect(useGameStore.getState().steak.chips).toBe(4700);
  });

  it('rejects a withdrawal larger than the chip balance', () => {
    const result = useGameStore.getState().steakWithdraw(99_999);

    expect(result.ok).toBe(false);
    expect(useGameStore.getState().steak.chips).toBe(5000);
  });

  it('settles a bet and records it', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1); // heads

    const result = useGameStore.getState().playSteakBet({ game: 'coinflip', side: 'heads' }, 100);

    expect(result.ok).toBe(true);
    expect(result.outcome?.won).toBe(true);
    expect(useGameStore.getState().steak.chips).toBe(5096); // 5000 - 100 + 196
    expect(useGameStore.getState().steak.bets[0]).toMatchObject({
      game: 'coinflip',
      amount: 100,
      won: true,
    });
  });

  it('rejects a bet larger than the chip balance', () => {
    const result = useGameStore.getState().playSteakBet({ game: 'coinflip', side: 'heads' }, 99_999);

    expect(result.ok).toBe(false);
    expect(useGameStore.getState().steak.chips).toBe(5000);
    expect(useGameStore.getState().steak.bets).toHaveLength(0);
  });
});
