import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME_EPOCH, useGameStore } from '@/store/gameStore';
import { SteakApp } from './steak/SteakApp';

beforeEach(() => {
  useGameStore.setState({
    playerName: '이지훈',
    cash: 1_500_000,
    gameDateTime: GAME_EPOCH,
    steak: { chips: 250_000, bets: [] },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('steak app', () => {
  it('shows the player name, chips and the empty history', () => {
    render(<SteakApp />);

    expect(screen.getByText('이지훈')).toBeInTheDocument();
    expect(screen.getByText('아직 베팅 기록이 없습니다.')).toBeInTheDocument();
  });

  it('turns cash into chips', async () => {
    const user = userEvent.setup();
    render(<SteakApp />);

    await user.click(screen.getByRole('button', { name: '칩 충전' }));
    await user.type(screen.getByLabelText('충전 금액'), '200000');
    await user.click(screen.getByRole('button', { name: '충전하기' }));

    expect(useGameStore.getState().cash).toBe(1_300_000);
    expect(useGameStore.getState().steak.chips).toBe(450_000);
    expect(await screen.findByRole('status')).toHaveTextContent('충전');
  });

  it('plays a coin flip and shows the result', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1); // heads
    const user = userEvent.setup();
    render(<SteakApp />);

    await user.click(screen.getByRole('button', { name: '앞면에 베팅' }));

    expect(await screen.findByText('승리')).toBeInTheDocument();
    expect(screen.getByText('앞면이 나왔습니다.')).toBeInTheDocument();
    expect(useGameStore.getState().steak.chips).toBe(259_600);
  });

  it('switches between dice and crash controls', async () => {
    const user = userEvent.setup();
    render(<SteakApp />);

    await user.click(screen.getByRole('button', { name: '주사위' }));
    expect(screen.getByRole('button', { name: '주사위 굴리기' })).toBeInTheDocument();
    expect(screen.getByLabelText('주사위 기준')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '크래시' }));
    expect(screen.getByRole('button', { name: '크래시 시작' })).toBeInTheDocument();
    expect(screen.getByLabelText('크래시 목표 배당')).toBeInTheDocument();
  });
});
