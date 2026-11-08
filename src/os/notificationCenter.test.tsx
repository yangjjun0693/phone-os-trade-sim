import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { GAME_EPOCH, useGameStore } from '@/store/gameStore';
import { useOSStore } from '@/store/osStore';
import { NotificationCenter } from './NotificationCenter';

beforeEach(() => {
  useGameStore.setState({ gameDateTime: GAME_EPOCH, day: 1 });
  useOSStore.setState({
    overlay: 'notification',
    notifications: [
      { id: 'a', appId: 'bank', priority: 'high', title: '초콜렛뱅크', body: '고액 입금', createdAt: GAME_EPOCH, read: false, action: { type: 'openApp', appId: 'bank' } },
      { id: 'b', appId: 'delivery', priority: 'normal', title: '구팡', body: '수령 대기', createdAt: GAME_EPOCH, read: false },
    ],
  });
});

describe('NotificationCenter', () => {
  it('lists notifications and marks one read on tap', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);
    await user.click(screen.getByText('초콜렛뱅크'));
    expect(useOSStore.getState().notifications.find((n) => n.id === 'a')?.read).toBe(true);
  });

  it('deletes one', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);
    await user.click(screen.getByRole('button', { name: '초콜렛뱅크 삭제' }));
    expect(useOSStore.getState().notifications.map((n) => n.id)).toEqual(['b']);
  });

  it('marks read on tap even when there is no app/action (no crash)', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);
    await user.click(screen.getByText('구팡'));
    expect(useOSStore.getState().notifications.find((n) => n.id === 'b')?.read).toBe(true);
  });
});
