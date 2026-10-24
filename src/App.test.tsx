import { act } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { DEFAULT_LAYOUT } from './store/defaults';
import { useOSStore } from './store/osStore';

beforeEach(() => {
  useOSStore.setState({
    locked: true,
    editing: false,
    openAppId: null,
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
    expect(await screen.findByText('대화')).toBeInTheDocument();

    await act(async () => {
      useOSStore.getState().goHome();
    });
    expect(useOSStore.getState().openAppId).toBeNull();
  });
});
