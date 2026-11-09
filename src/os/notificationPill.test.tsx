import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { GAME_EPOCH, useGameStore } from '@/store/gameStore';
import { useOSStore } from '@/store/osStore';
import { StatusBar } from './StatusBar';

beforeEach(() => {
  useGameStore.setState({ gameDateTime: GAME_EPOCH });
  useOSStore.setState({
    overlay: 'none',
    pillId: 'p1', pillSeq: 1,
    notifications: [{ id: 'p1', appId: 'delivery', priority: 'urgent', title: '압수', body: '물량을 잃었습니다', createdAt: GAME_EPOCH, read: false }],
  });
});

describe('notification pill', () => {
  it('shows the active high/urgent item', () => {
    render(<StatusBar />);
    expect(screen.getByText('압수')).toBeInTheDocument();
  });
  it('hides while an overlay is open', () => {
    useOSStore.setState({ overlay: 'notification' });
    render(<StatusBar />);
    expect(screen.queryByText('압수')).not.toBeInTheDocument();
  });
});
