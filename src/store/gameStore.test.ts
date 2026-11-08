import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME_EPOCH, useGameStore } from './gameStore';
import { onGameEvent } from '@/lib/notificationBus';
import type { GameEvent } from '@/game/notifications';
import type { Shipment } from '@/game/shipments';

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

afterEach(() => {
  vi.restoreAllMocks();
});

describe('gameStore', () => {
  it('starts a fresh run with four green jelly in stock', () => {
    useGameStore.getState().restartGame();
    const jelly = useGameStore
      .getState()
      .inventory.find((item) => item.productId === 'product-jelly');
    expect(jelly?.qty).toBe(4);
    expect(jelly?.marketPrice).toBe(16_000);
  });

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

  it('emits bank.deposit when a deposit is flagged', () => {
    const seen: string[] = [];
    const off = onGameEvent((e) => seen.push(e.type));
    useGameStore.setState({ cash: 1_500_000, bank: { balance: 0, transactions: [] }, gameDateTime: GAME_EPOCH, status: 'playing' });
    useGameStore.getState().bankDeposit(1_200_000);
    off();
    expect(seen).toContain('bank.deposit');
  });

  it('does not emit bank.deposit for an ordinary deposit', () => {
    const seen: string[] = [];
    const off = onGameEvent((e) => seen.push(e.type));
    useGameStore.setState({ cash: 1_500_000, bank: { balance: 0, transactions: [] }, gameDateTime: GAME_EPOCH, status: 'playing' });
    const result = useGameStore.getState().bankDeposit(200_000);
    off();
    expect(result.flagged).toBe(false);
    expect(seen).not.toContain('bank.deposit');
  });

  it('emits messenger.arrival when someone writes in', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const seen: GameEvent[] = [];
    const off = onGameEvent((e) => seen.push(e));
    useGameStore.setState({
      status: 'playing',
      heat: 12,
      gameDateTime: '2026-03-15T21:47:00.000Z',
      messengerLastAt: GAME_EPOCH,
      inbox: [],
      deals: [],
      trust: 20,
    });
    useGameStore.getState().tickMessenger();
    off();
    const arrival = seen.find((e) => e.type === 'messenger.arrival');
    expect(arrival).toBeDefined();
    if (arrival?.type !== 'messenger.arrival') throw new Error('no arrival');
    expect(arrival.npcId).toBeTruthy();
    expect(arrival.npcName).toBeTruthy();
    expect(['telegraph', 'phone']).toContain(arrival.channel);
  });

  it('emits shipment.landed for a parcel that lands', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const seen: GameEvent[] = [];
    const off = onGameEvent((e) => seen.push(e));
    const shipment: Shipment = {
      id: 'ship-test',
      marketId: 'market-nightbazaar',
      productId: 'product-jelly',
      productName: '엑스터시 젤리',
      qty: 4,
      unitCost: 6_000,
      marketPrice: 16_000,
      address: 'storage',
      fee: 30_000,
      orderedAt: GAME_EPOCH,
      etaAt: GAME_EPOCH,
      status: 'in_transit',
    };
    useGameStore.setState({
      status: 'playing',
      heat: 12,
      gameDateTime: '2026-03-20T00:00:00.000Z',
      shipments: [shipment],
    });
    useGameStore.getState().tickShipments();
    off();
    const landed = seen.find((e) => e.type === 'shipment.landed');
    expect(landed).toBeDefined();
    if (landed?.type !== 'shipment.landed') throw new Error('no shipment event');
    expect(landed.shipmentId).toBe('ship-test');
    expect(landed.status).toBe('arrived');
    expect(landed.productName).toBe('엑스터시 젤리');
    expect(landed.qty).toBe(4);
  });
});
