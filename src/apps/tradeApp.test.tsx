import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME_EPOCH, useGameStore } from '@/store/gameStore';
import { TradeApp } from './trade/TradeApp';

beforeEach(() => {
  useGameStore.getState().restartGame();
  useGameStore.setState({
    cash: 1_500_000,
    heat: 12,
    day: 1,
    gameDateTime: GAME_EPOCH,
    inventory: [
      {
        id: 'i1',
        productId: 'product-pill',
        name: '미상의 알약',
        qty: 10,
        unitCost: 4000,
        marketPrice: 11000,
      },
    ],
    bank: { balance: 8_200_000, transactions: [] },
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

describe('TradeApp', () => {
  it('shows the retirement goal and starts a customer shift', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const user = userEvent.setup();
    render(<TradeApp />);

    expect(screen.getByText('은퇴 목표')).toBeInTheDocument();
    await user.click(screen.getByText('손님 받기'));

    expect(screen.getByText('수락')).toBeInTheDocument();
    expect(screen.getByText('+18%')).toBeInTheDocument();
    expect(screen.getByText('거절')).toBeInTheDocument();
  });

  it('completes a sale and updates the run stats', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const user = userEvent.setup();
    render(<TradeApp />);

    await user.click(screen.getByText('손님 받기'));
    await user.click(screen.getByText('수락'));

    expect(screen.getByRole('status')).toHaveTextContent('넘겼습니다');
    expect(useGameStore.getState().stats.sales).toBe(1);
    expect(useGameStore.getState().inventory[0].qty).toBe(6);
  });

  it('charges heat for turning a customer away', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const user = userEvent.setup();
    render(<TradeApp />);

    await user.click(screen.getByText('손님 받기'));
    await user.click(screen.getByText('거절'));

    expect(useGameStore.getState().heat).toBe(13);
    expect(screen.getByRole('status')).toHaveTextContent('heat +1');
  });

  it('shows the day report when the day is closed', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const user = userEvent.setup();
    render(<TradeApp />);

    await user.click(screen.getByText('하루 마감하고 다음 날로'));

    expect(screen.getByText('오늘의 정산')).toBeInTheDocument();
    expect(screen.getByText('하루 지출')).toBeInTheDocument();
    expect(useGameStore.getState().day).toBe(2);
  });
});
