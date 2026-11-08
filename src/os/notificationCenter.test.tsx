import { fireEvent, render, screen } from '@testing-library/react';
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

/**
 * Simulate a drag and the `click` a browser dispatches after it.
 *
 * jsdom reports `ontouchstart` but not `onpointerdown`, so @use-gesture binds the
 * `touch` device here (pointer capture off, which is what keeps this test from
 * hitting jsdom's missing `setPointerCapture`). Plain objects stand in for the
 * `Touch` entries that only need `clientX`/`clientY`/`identifier`/`target`.
 */
function dragThenClick(target: Element, { dx = 0, dy = 0 } = {}) {
  const touch = (clientX: number, clientY: number) =>
    ({ clientX, clientY, identifier: 1, target }) as unknown as Touch;
  const from = [touch(200, 200)];
  const to = [touch(200 + dx, 200 + dy)];
  fireEvent.touchStart(target, { touches: from, targetTouches: from, changedTouches: from });
  fireEvent.touchMove(target, { touches: to, targetTouches: to, changedTouches: to });
  fireEvent.touchEnd(target, { touches: [], targetTouches: [], changedTouches: to });
  fireEvent.click(target);
}

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

  it('ignores the click that follows a card drag (no spurious open)', () => {
    render(<NotificationCenter />);
    const card = screen.getByText('초콜렛뱅크').closest('button');
    if (!card) throw new Error('card button not found');
    // A real drag (beyond the 1px tap threshold) but short of the delete swipe,
    // followed by the trailing click a browser fires after the drag.
    dragThenClick(card, { dx: -20 });
    expect(useOSStore.getState().notifications.find((n) => n.id === 'a')?.read).toBe(false);
    expect(useOSStore.getState().notifications.map((n) => n.id)).toEqual(['a', 'b']);
  });

  it('ignores the click that follows a shade drag (no spurious dismiss)', () => {
    render(<NotificationCenter />);
    // A small downward drag that is not a dismiss swipe, released over the
    // background button, plus the trailing click.
    dragThenClick(screen.getByRole('button', { name: '알림 닫기' }), { dy: 20 });
    expect(useOSStore.getState().overlay).toBe('notification');
  });
});
