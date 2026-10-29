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
  it('draws the boot greeting with the matching hand-lettered face', () => {
    render(<Onboarding />);

    const hello = screen.getByText('hello');
    expect(hello).toHaveClass('hello-word');
    expect(hello).toHaveAttribute('data-script', 'latin');
    expect(hello).toHaveAttribute('lang', 'en');
  });

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
  it('starts with the first step already open on a fresh save', () => {
    render(<TutorialGuide />);

    const dialog = screen.getByRole('dialog', { name: '플레이 가이드' });
    expect(dialog).toHaveTextContent(TUTORIAL_STEPS[0].title);
    expect(dialog).toHaveTextContent('택배 0 / 1');
    // The card replaces the pill while it is open, and carries its own way out.
    expect(screen.getByRole('button', { name: '가이드 카드 접기' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '가이드 펼치기' })).not.toBeInTheDocument();
  });

  it('opens the app it points at, and gets out of the way', async () => {
    render(<TutorialGuide />);

    await userEvent.click(screen.getByRole('button', { name: /Chroma 열기/ }));

    expect(useOSStore.getState().openAppId).toBe('chroma');
    // Opening through the OS also feeds the "visited apps" list.
    expect(useTutorialStore.getState().openedApps).toContain('chroma');
    // The card leaves the way clear while its exit animation plays out.
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('can be collapsed into the pill and reopened', async () => {
    render(<TutorialGuide />);

    await userEvent.click(screen.getByRole('button', { name: '가이드 카드 접기' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    // Collapsed, the pill takes over as the handle back into the guide.
    await userEvent.click(screen.getByRole('button', { name: '가이드 펼치기' }));
    expect(screen.getByRole('dialog', { name: '플레이 가이드' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: '가이드 펼치기' })).not.toBeInTheDocument(),
    );
  });

  it('shows what the current step is waiting for', async () => {
    // Step two is the "open the dark-net browser" step.
    useTutorialStore.setState({ stepIndex: 1, done: ['buy'] });
    render(<TutorialGuide />);
    await userEvent.click(screen.getByRole('button', { name: '가이드 펼치기' }));

    expect(screen.getByRole('dialog')).toHaveTextContent('앱을 열면 완료');
  });

  it('ticks a step off automatically when the game catches up', async () => {
    useTutorialStore.setState({ stepIndex: 1, done: ['buy'], openedApps: ['shade'] });
    render(<TutorialGuide />);
    await userEvent.click(screen.getByRole('button', { name: '가이드 펼치기' }));

    await waitFor(
      () => {
        expect(useTutorialStore.getState().done).toContain('shade');
      },
      { timeout: 2500 },
    );
    expect(useTutorialStore.getState().stepIndex).toBe(2);
    expect(await screen.findByRole('dialog')).toHaveTextContent(TUTORIAL_STEPS[2].title);
  });

  it('lets the player skip a step by hand', async () => {
    render(<TutorialGuide />);
    await userEvent.click(screen.getByRole('button', { name: '이 단계 건너뛰기' }));

    expect(useTutorialStore.getState().done).toEqual(['buy']);
    expect(useTutorialStore.getState().stepIndex).toBe(1);
  });

  it('can be turned off and restarted from the same card', async () => {
    useTutorialStore.setState({ done: TUTORIAL_STEPS.map((step) => step.id), stepIndex: TUTORIAL_STEPS.length });
    render(<TutorialGuide />);

    await userEvent.click(screen.getByRole('button', { name: '가이드 펼치기' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('가이드 완료');

    await userEvent.click(screen.getByRole('button', { name: '처음부터 다시' }));

    const state = useTutorialStore.getState();
    expect(state.done).toEqual([]);
    expect(state.stepIndex).toBe(0);
    expect(state.active).toBe(true);
  });

  it('hides itself when the player quits the guide', async () => {
    render(<TutorialGuide />);
    await userEvent.click(screen.getByText(/그만 보기/));

    expect(useTutorialStore.getState().active).toBe(false);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
