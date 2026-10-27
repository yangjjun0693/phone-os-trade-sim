import { act } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { DEFAULT_LAYOUT } from './store/defaults';
import { useOSStore } from './store/osStore';
import { useTutorialStore } from './store/tutorialStore';

beforeEach(() => {
  // These tests start on the lock screen of an already-set-up device.
  useTutorialStore.setState({
    introSeen: true,
    setupDone: true,
    active: false,
    stepIndex: 0,
    done: [],
    openedApps: [],
  });
  useOSStore.setState({
    locked: true,
    editing: false,
    openAppId: null,
    appSession: 0,
    recents: [],
    overlay: 'none',
    layout: {
      pages: DEFAULT_LAYOUT.pages.map((page) => [...page]),
      dock: [...DEFAULT_LAYOUT.dock],
    },
  });
});

describe('<App />', () => {
  it('boots into the lock screen', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: '손전등' })).toBeInTheDocument();
    expect(screen.getByText('위로 밀어 잠금 해제')).toBeInTheDocument();
  });

  it('reveals the home screen and dock after unlocking', async () => {
    render(<App />);

    await userEvent.click(screen.getByText('위로 밀어 잠금 해제'));

    expect(await screen.findByLabelText('거래')).toBeInTheDocument();
    expect(await screen.findByLabelText('설정')).toBeInTheDocument();
  });

  it('opens an app from the dock and returns home', async () => {
    useOSStore.setState({ locked: false });
    render(<App />);

    await userEvent.click(await screen.findByLabelText('메시지/통화'));

    expect(useOSStore.getState().openAppId).toBe('messagesCall');
    expect(await screen.findByText('거래 메시지')).toBeInTheDocument();

    await act(async () => {
      useOSStore.getState().goHome();
    });
    expect(useOSStore.getState().openAppId).toBeNull();
  });

  it('shows the greeting intro on a fresh device, before the lock screen', () => {
    useTutorialStore.setState({
      introSeen: false,
      setupDone: false,
      active: false,
      stepIndex: 0,
      done: [],
      openedApps: [],
    });
    render(<App />);

    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '건너뛰기' })).toBeInTheDocument();
  });

  it('highlights the guide app on home and hides the guide inside an app', async () => {
    useTutorialStore.setState({
      introSeen: true,
      setupDone: true,
      active: true,
      stepIndex: 0,
      done: [],
      openedApps: [],
      defaultIdentity: 'alias',
    });
    useOSStore.setState({ locked: false });
    render(<App />);

    expect(await screen.findByLabelText('가이드 펼치기')).toBeInTheDocument();
    expect(
      (await screen.findByLabelText('초선일보')).querySelector('[data-tutorial-highlight]'),
    ).not.toBeNull();

    // jsdom cannot replay userEvent's pointer sequence through the home pager,
    // so click the icon directly (real taps are covered by Playwright).
    fireEvent.click(screen.getByLabelText('초선일보'));

    expect(useOSStore.getState().openAppId).toBe('news');
    expect(useTutorialStore.getState().openedApps).toContain('news');
    // The card never covers an app's nav bar.
    expect(screen.queryByLabelText('가이드 펼치기')).not.toBeInTheDocument();
  });
});
