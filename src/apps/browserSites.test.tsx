import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addMinutes } from 'date-fns';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME_EPOCH, useGameStore } from '@/store/gameStore';
import { SiteView } from './browser/BrowserSite';
import type { BrowserTab } from './browser/browserData';

function makeTab(overrides: Partial<BrowserTab>): BrowserTab {
  return { id: 'tab-1', url: '', title: '', loading: false, progress: 1, ...overrides };
}

const noop = () => undefined;

beforeEach(() => {
  useGameStore.getState().restartGame();
  useGameStore.setState({
    cash: 1_500_000,
    heat: 12,
    gameDateTime: GAME_EPOCH,
    discoveredMarkets: ['market-nightbazaar'],
    learnedClues: [],
    handledTraps: [],
    stats: {
      sales: 0,
      revenue: 0,
      unitsSold: 0,
      spent: 0,
      stings: 0,
      videosWatched: 0,
      searchesRun: 0,
      wikiRead: 0,
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('everyday sites', () => {
  it('watching a clip advances the clock and teaches its clue', async () => {
    const user = userEvent.setup();
    render(
      <SiteView
        tab={makeTab({ url: 'hxxp://viewtube.kr', siteId: 'viewtube', title: 'ViewTube' })}
        browser="chroma"
        onNavigate={noop}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: /시청/ })[0]);

    const state = useGameStore.getState();
    expect(state.gameDateTime).toBe(addMinutes(new Date(GAME_EPOCH), 21).toISOString());
    expect(state.learnedClues.some((clue) => clue.id === 'clue-vt-quickdrop')).toBe(true);
    expect(state.stats.videosWatched).toBe(1);
  });

  it('a trap link bites the player', async () => {
    const user = userEvent.setup();
    render(
      <SiteView
        tab={makeTab({ url: 'hxxp://viewtube.kr', siteId: 'viewtube', title: 'ViewTube' })}
        browser="chroma"
        onNavigate={noop}
      />,
    );

    await user.click(screen.getByRole('button', { name: /설명란 링크 열기/ }));

    const state = useGameStore.getState();
    expect(state.cash).toBe(1_410_000);
    expect(state.heat).toBe(14);
    expect(state.handledTraps).toContain('vt-free');
  });

  it('handleTrap only fires once', () => {
    expect(useGameStore.getState().handleTrap('trap-x', { cash: 1000 })).toBe(true);
    expect(useGameStore.getState().handleTrap('trap-x', { cash: 1000 })).toBe(false);
    expect(useGameStore.getState().cash).toBe(1_499_000);
  });

  it('search records activity and hides unknown onion addresses', async () => {
    render(
      <SiteView
        tab={makeTab({ url: 'hxxp://sleuth.kr/search?q=nightbazaar', siteId: 'sleuth' })}
        browser="shade"
        onNavigate={noop}
      />,
    );

    expect(await screen.findByText('NightBazaar')).toBeInTheDocument();
    // A market that has not been discovered never appears.
    expect(screen.queryByText('LastCall')).not.toBeInTheDocument();
  });

  it('reading the darknet article unlocks the onion wiki', async () => {
    const user = userEvent.setup();
    render(
      <SiteView
        tab={makeTab({ url: 'hxxp://openpedia.kr', siteId: 'openpedia', title: 'OpenPedia' })}
        browser="chroma"
        onNavigate={noop}
      />,
    );

    await user.click(screen.getByText('다크넷 문서고 (심층 문서)'));

    const state = useGameStore.getState();
    expect(state.discoveredMarkets).toContain('openpedia-onion');
    expect(state.stats.wikiRead).toBe(1);
  });
});
