import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { getApp } from '@/apps/registry';
import { useOSStore } from '@/store/osStore';
import { useTutorialStore } from '@/store/tutorialStore';
import { AppIcon } from './AppIcon';
import { LockScreen } from './LockScreen';

beforeEach(() => {
  useTutorialStore.getState().reset();
  useTutorialStore.setState({ notifications: true });
  useOSStore.setState({
    locked: true,
    openAppId: null,
    notifications: [
      { id: 'a', appId: 'bank', priority: 'normal', title: 't', body: 'b', createdAt: 'x', read: false },
      { id: 'b', appId: 'bank', priority: 'normal', title: 't', body: 'b', createdAt: 'x', read: false },
    ],
  });
});

describe('AppIcon badge', () => {
  it('shows the unread count for its app', () => {
    render(<AppIcon app={getApp('bank')!} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders no badge for an app with nothing unread', () => {
    render(<AppIcon app={getApp('delivery')!} />);
    expect(screen.queryByLabelText(/알림/)).not.toBeInTheDocument();
  });

  it('caps the pill at 9+ and labels it for screen readers', () => {
    useOSStore.setState({
      notifications: Array.from({ length: 11 }, (_, i) => ({
        id: `n${i}`,
        appId: 'bank',
        priority: 'normal' as const,
        title: 't',
        body: 'b',
        createdAt: 'x',
        read: false,
      })),
    });
    render(<AppIcon app={getApp('bank')!} />);
    expect(screen.getByText('9+')).toBeInTheDocument();
    expect(screen.getByLabelText('초콜렛뱅크 알림 11')).toBeInTheDocument();
  });
});

describe('LockScreen grouped preview', () => {
  it('shows the latest of a group plus a remaining count, bold while unread', () => {
    render(<LockScreen />);
    const title = screen.getByText('t');
    expect(title).toBeInTheDocument();
    expect(title.className).toContain('font-bold');
    expect(screen.getByText('+1')).toBeInTheDocument();

    fireEvent.click(title.closest('button')!);
    const state = useOSStore.getState();
    expect(state.notifications.find((n) => n.id === 'a')?.read).toBe(true);
    expect(state.locked).toBe(false);
    expect(state.openAppId).toBe('bank');
  });

  it('unlocks without crashing when the latest has no app id', () => {
    useOSStore.setState({
      notifications: [
        { id: 'z', priority: 'normal', title: 'hi', body: 'b', createdAt: 'x', read: false },
      ],
    });
    render(<LockScreen />);

    fireEvent.click(screen.getByText('hi').closest('button')!);
    expect(useOSStore.getState().locked).toBe(false);
    expect(useOSStore.getState().openAppId).toBeNull();
  });

  it('shows nothing when notification consent is off', () => {
    useTutorialStore.setState({ notifications: false });
    render(<LockScreen />);
    expect(screen.queryByText('t')).not.toBeInTheDocument();
  });
});
