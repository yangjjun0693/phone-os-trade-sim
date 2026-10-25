import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { GAME_EPOCH, useGameStore } from '@/store/gameStore';
import { BankApp } from './bank/BankApp';
import { SettingsApp } from './settings/SettingsApp';
import { WalletApp } from './wallet/WalletApp';

beforeEach(() => {
  useGameStore.setState({
    playerName: '이지훈',
    cash: 1_500_000,
    heat: 12,
    day: 1,
    gameDateTime: GAME_EPOCH,
    identities: {},
    bank: { balance: 8_200_000, transactions: [] },
    steak: { chips: 250_000, bets: [] },
  });
});

describe('player name', () => {
  it('appears on the wallet card', () => {
    render(<WalletApp />);

    expect(screen.getByText('이지훈')).toBeInTheDocument();
  });

  it('is the bank account holder', () => {
    render(<BankApp />);

    expect(screen.getByText('예금주 이지훈')).toBeInTheDocument();
  });

  it('is shown in the settings profile', () => {
    render(<SettingsApp />);

    expect(screen.getByText('이지훈')).toBeInTheDocument();
    expect(screen.getByText('플레이어')).toBeInTheDocument();
  });
});
