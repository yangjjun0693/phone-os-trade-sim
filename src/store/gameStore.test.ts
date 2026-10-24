import { beforeEach, describe, expect, it } from 'vitest';
import { GAME_EPOCH, useGameStore } from './gameStore';

beforeEach(() => {
  useGameStore.setState({
    cash: 1240,
    heat: 12,
    day: 1,
    gameDateTime: GAME_EPOCH,
    inventory: [],
  });
});

describe('gameStore', () => {
  it('never lets cash drop below zero', () => {
    useGameStore.getState().addCash(-9999);
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
});
