import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { markets } from '@/data';
import { GAME_EPOCH, useGameStore } from '@/store/gameStore';
import { MarketOffers } from './browser/MarketOffers';

beforeEach(() => {
  useGameStore.getState().restartGame();
  useGameStore.setState({
    cash: 5_000_000,
    heat: 10,
    day: 1,
    gameDateTime: GAME_EPOCH,
    inventory: [],
    bank: { balance: 0, transactions: [] },
    status: 'playing',
    statusReason: '',
    purchases: {},
    stats: { sales: 0, revenue: 0, unitsSold: 0, spent: 0, stings: 0 },
    lastReport: null,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MarketOffers', () => {
  it('orders a lot and marks it as bought for the day', async () => {
    const user = userEvent.setup();
    render(<MarketOffers market={markets[0]} />);

    await user.click(screen.getAllByRole('button', { name: '주문' })[0]);

    expect(screen.getByText('매입 완료')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(useGameStore.getState().inventory.length).toBeGreaterThan(0);
    expect(useGameStore.getState().cash).toBeLessThan(5_000_000);
  });

  it('warns when a suspicious order delivers nothing', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const scam = markets.find((entry) => entry.id === 'market-quickdrop')!;
    const user = userEvent.setup();
    render(<MarketOffers market={scam} />);

    await user.click(screen.getAllByRole('button', { name: '주문' })[0]);

    expect(screen.getByRole('status')).toHaveTextContent('사라졌다');
    expect(useGameStore.getState().inventory).toHaveLength(0);
  });
});
