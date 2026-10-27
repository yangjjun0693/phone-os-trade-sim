import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { TUTORIAL_STEPS } from '@/content/tutorial';
import { useGameStore } from '@/store/gameStore';
import { useOSStore } from '@/store/osStore';
import { useTutorialStore } from '@/store/tutorialStore';
import { Onboarding } from './Onboarding';
import { TutorialGuide } from './TutorialGuide';

/** A save with nothing done yet, so the guide starts at step one. */
function resetStores() {
  useTutorialStore.getState().reset();
  useTutorialStore.setState({
    introSeen: true,
    setupDone: true,
    active: true,
    stepIndex: 0,
    done: [],
    openedApps: [],
    deviceName: '테스트폰',
    defaultIdentity: 'alias',
  });
  useGameStore.setState({
    playerName: '이지훈',
    inventory: [],
    shipments: [],
    discoveredMarkets: ['market-nightbazaar'],
    inbox: [],
    stats: { sales: 0, revenue: 0, unitsSold: 0, spent: 0, stings: 0 },
    bank: { balance: 8_200_000, transactions: [] },
    day: 1,
  });
  useOSStore.setState({
    locked: false,
    openAppId: null,
    appSession: 0,
    recents: [],
    overlay: 'none',
  });
}

beforeEach(resetStores);

describe('onboarding', () => {
  it('walks name → identity → device → consent and commits the setup', async () => {
    render(<Onboarding />);

    // Intro can be skipped straight into the setup wizard.
    await userEvent.click(screen.getByRole('button', { name: '건너뛰기' }));
    expect(screen.getByLabelText('이름')).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText('이름'));
    await userEvent.type(screen.getByLabelText('이름'), '박서준');
    await userEvent.click(screen.getByRole('button', { name: '계속' }));

    expect(await screen.findByText('어떤 이름으로 움직일까?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /실명/ }));
    await userEvent.click(screen.getByRole('button', { name: '계속' }));

    expect(await screen.findByText('이 폰의 이름은?')).toBeInTheDocument();
    await userEvent.clear(await screen.findByLabelText('기기 이름'));
    await userEvent.type(screen.getByLabelText('기기 이름'), '서준폰');
    await userEvent.click(screen.getByRole('button', { name: '계속' }));

    expect(await screen.findByText('알림과 소리')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '시작하기' }));

    const tutorial = useTutorialStore.getState();
    expect(tutorial.setupDone).toBe(true);
    expect(tutorial.active).toBe(true);
    expect(tutorial.deviceName).toBe('서준폰');
    expect(tutorial.defaultIdentity).toBe('realname');
    expect(tutorial.notifications).toBe(true);
    expect(tutorial.sound).toBe(true);
    expect(useGameStore.getState().playerName).toBe('박서준');
  });

  it('can be skipped from the wizard with the defaults', async () => {
    render(<Onboarding />);

    await userEvent.click(screen.getByRole('button', { name: '건너뛰기' }));
    // The header skip finishes the rest of the setup as-is.
    await userEvent.click(screen.getByRole('button', { name: '건너뛰기' }));

    const tutorial = useTutorialStore.getState();
    expect(tutorial.setupDone).toBe(true);
    expect(tutorial.deviceName).toBe('이지훈의 iPhone');
    expect(tutorial.defaultIdentity).toBe('alias');
  });
});

describe('tutorial guide', () => {
  it('shows step one and opens the app it points at', async () => {
    render(<TutorialGuide />);

    await userEvent.click(screen.getByRole('button', { name: '가이드 펼치기' }));

    const dialog = screen.getByRole('dialog', { name: '플레이 가이드' });
    expect(dialog).toHaveTextContent(TUTORIAL_STEPS[0].title);

    await userEvent.click(screen.getByRole('button', { name: /앱 열기/ }));

    expect(useOSStore.getState().openAppId).toBe('news');
    // Opening through the OS also feeds the "visited apps" list.
    expect(useTutorialStore.getState().openedApps).toContain('news');
  });

  it('ticks a step off automatically when the game catches up', async () => {
    useTutorialStore.setState({ openedApps: ['news'] });
    render(<TutorialGuide />);

    await waitFor(
      () => {
        expect(useTutorialStore.getState().done).toContain('news');
      },
      { timeout: 2500 },
    );
    expect(useTutorialStore.getState().stepIndex).toBe(1);
    expect(await screen.findByText(TUTORIAL_STEPS[1].title)).toBeInTheDocument();
  });

  it('lets the player skip a step by hand', async () => {
    render(<TutorialGuide />);
    await userEvent.click(screen.getByRole('button', { name: '가이드 펼치기' }));
    await userEvent.click(screen.getByRole('button', { name: '이 단계 건너뛰기' }));

    expect(useTutorialStore.getState().done).toEqual(['news']);
    expect(useTutorialStore.getState().stepIndex).toBe(1);
  });

  it('can be turned off and restarted from the same card', async () => {
    useTutorialStore.setState({ done: TUTORIAL_STEPS.map((step) => step.id), stepIndex: TUTORIAL_STEPS.length });
    render(<TutorialGuide />);

    await userEvent.click(screen.getByRole('button', { name: '가이드 펼치기' }));
    expect(screen.getAllByText('가이드 완료').length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: '처음부터 다시' }));

    const state = useTutorialStore.getState();
    expect(state.done).toEqual([]);
    expect(state.stepIndex).toBe(0);
    expect(state.active).toBe(true);
  });

  it('hides itself when the player quits the guide', async () => {
    render(<TutorialGuide />);
    await userEvent.click(screen.getByRole('button', { name: '가이드 펼치기' }));
    await userEvent.click(screen.getByText(/그만 보기/));

    expect(useTutorialStore.getState().active).toBe(false);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
