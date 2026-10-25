import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { GAME_EPOCH, useGameStore } from '@/store/gameStore';
import { BankApp } from './bank/BankApp';
import { DeliveryApp } from './delivery/DeliveryApp';
import { MapApp } from './map/MapApp';
import { NewsApp } from './news/NewsApp';

beforeEach(() => {
  useGameStore.setState({
    cash: 1_500_000,
    heat: 12,
    gameDateTime: GAME_EPOCH,
    bank: { balance: 8_200_000, transactions: [] },
  });
});

describe('daily-life apps', () => {
  it('bank: deposits cash and shows the alert for a large deposit', async () => {
    const user = userEvent.setup();
    render(<BankApp />);

    await user.type(screen.getByPlaceholderText('0'), '1000000');
    await user.click(screen.getByRole('button', { name: /입금/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('확인 중');
    expect(useGameStore.getState().bank.balance).toBe(9_200_000);
  });

  it('bank: shows an error when the amount is empty', async () => {
    const user = userEvent.setup();
    render(<BankApp />);

    await user.click(screen.getByRole('button', { name: /출금/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('금액');
  });

  it('news: opens and closes an article, and shows breaking news only when hot', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<NewsApp />);
    expect(screen.queryByText(/속보가 있습니다/)).not.toBeInTheDocument();

    await user.click(screen.getByText(/월세 평균 또 올랐다/));
    expect(screen.getByRole('button', { name: '목록으로' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '목록으로' }));

    useGameStore.setState({ heat: 70 });
    rerender(<NewsApp />);
    expect(await screen.findByText(/속보가 있습니다/)).toBeInTheDocument();
  });

  it('delivery: lists parcels and opens the tracking timeline', async () => {
    const user = userEvent.setup();
    render(<DeliveryApp />);

    expect(screen.getByText('서류 봉투')).toBeInTheDocument();
    await user.click(screen.getByText('서류 봉투'));
    expect(await screen.findByText(/추가 확인이 필요해/)).toBeInTheDocument();
  });

  it('map: renders pins and shows the place sheet', async () => {
    const user = userEvent.setup();
    render(<MapApp />);

    await user.click(screen.getByRole('button', { name: '24시 편의점' }));
    expect(await screen.findByText(/지금 .*(한산함|순찰 있음|순찰 잦음)/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '닫기' }));
  });
});
