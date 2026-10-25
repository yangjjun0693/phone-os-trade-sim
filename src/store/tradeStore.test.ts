import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { markets, products } from '@/data';
import { generateMarketOffers, type CustomerOffer } from '@/game/trade';
import { GAME_EPOCH, useGameStore } from './gameStore';

const market = markets.find((entry) => entry.id === 'market-nightbazaar')!;

function resetRun() {
  useGameStore.getState().restartGame();
  useGameStore.setState({
    cash: 5_000_000,
    heat: 10,
    day: 1,
    gameDateTime: GAME_EPOCH,
    inventory: [],
    bank: { balance: 0, transactions: [] },
    status: 'playing',
    statusReason: '',
    purchases: {},
    stats: { sales: 0, revenue: 0, unitsSold: 0, spent: 0, stings: 0 },
    lastReport: null,
  });
}

function customer(overrides: Partial<CustomerOffer> = {}): CustomerOffer {
  return {
    id: 'c1',
    profileId: 'npc-dal',
    name: '달이',
    kind: 'regular',
    itemId: 'i1',
    itemName: '미상의 알약',
    qty: 3,
    unitPrice: 50,
    total: 150,
    patience: 70,
    bio: '단골',
    ...overrides,
  };
}

beforeEach(() => {
  resetRun();
  useGameStore.setState({
    inventory: [
      {
        id: 'i1',
        productId: 'product-pill',
        name: '미상의 알약',
        qty: 10,
        unitCost: 4000,
        marketPrice: 11000,
      },
    ],
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('buying from a market', () => {
  it('spends cash and adds the delivered lot to inventory', () => {
    useGameStore.setState({ inventory: [] });
    const offer = generateMarketOffers(market, products, 1)[0];
    const total = offer.unitPrice * offer.qty;

    const result = useGameStore.getState().buyMarketOffer(offer, 'legit');
    const state = useGameStore.getState();

    expect(result.ok).toBe(true);
    expect(result.outcome?.deliveredQty).toBe(offer.qty);
    expect(state.cash).toBe(5_000_000 - total);
    expect(state.inventory[0].qty).toBe(offer.qty);
    expect(state.heat).toBe(11);
    expect(state.purchases[offer.id]).toBe(offer.qty);
  });

  it('does not let the player buy the same daily lot twice', () => {
    useGameStore.setState({ inventory: [] });
    const offer = generateMarketOffers(market, products, 1)[0];

    expect(useGameStore.getState().buyMarketOffer(offer, 'legit').ok).toBe(true);
    const cashAfterFirst = useGameStore.getState().cash;
    const second = useGameStore.getState().buyMarketOffer(offer, 'legit');

    expect(second.ok).toBe(false);
    expect(useGameStore.getState().cash).toBe(cashAfterFirst);
  });

  it('loses the money on a scam order', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    useGameStore.setState({ inventory: [] });
    const scam = markets.find((entry) => entry.id === 'market-quickdrop')!;
    const offer = generateMarketOffers(scam, products, 1)[0];

    const result = useGameStore.getState().buyMarketOffer(offer, 'scam');

    expect(result.ok).toBe(true);
    expect(result.outcome?.deliveredQty).toBe(0);
    expect(useGameStore.getState().inventory).toHaveLength(0);
    expect(useGameStore.getState().cash).toBe(5_000_000 - offer.unitPrice * offer.qty);
  });

  it('makes a honeypot order raise heat sharply', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const trap = markets.find((entry) => entry.id === 'market-clearnet')!;
    const offer = generateMarketOffers(trap, products, 1)[0];

    useGameStore.getState().buyMarketOffer(offer, 'honeypot');

    expect(useGameStore.getState().heat).toBe(32);
  });

  it('refuses orders the player cannot afford', () => {
    useGameStore.setState({ cash: 1 });
    const offer = generateMarketOffers(market, products, 1)[0];

    const result = useGameStore.getState().buyMarketOffer(offer, 'legit');

    expect(result.ok).toBe(false);
    expect(useGameStore.getState().cash).toBe(1);
  });
});

describe('selling to customers', () => {
  it('pays cash, removes stock and adds a little heat', () => {
    const result = useGameStore.getState().sellToCustomer(customer(), 'accept');
    const state = useGameStore.getState();

    expect(result.ok).toBe(true);
    expect(state.cash).toBe(5_000_150);
    expect(state.inventory[0].qty).toBe(7);
    expect(state.heat).toBe(11);
    expect(state.stats.sales).toBe(1);
    expect(state.stats.unitsSold).toBe(3);
    expect(state.gameDateTime).toBe('2026-03-14T22:02:00.000Z');
  });

  it('completes a successful counter-offer at a higher price', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = useGameStore.getState().sellToCustomer(customer(), 'counter');

    expect(result.ok).toBe(true);
    expect(result.total).toBe(177);
    expect(useGameStore.getState().cash).toBe(5_000_177);
  });

  it('keeps the stock when a counter-offer is rejected', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const result = useGameStore.getState().sellToCustomer(customer(), 'counter');

    expect(result.ok).toBe(false);
    expect(result.left).toBe(true);
    expect(useGameStore.getState().cash).toBe(5_000_000);
    expect(useGameStore.getState().inventory[0].qty).toBe(10);
  });

  it('loses the stock and raises heat when the buyer is undercover', () => {
    const result = useGameStore.getState().sellToCustomer(
      customer({ kind: 'undercover' }),
      'accept',
    );
    const state = useGameStore.getState();

    expect(result.ok).toBe(false);
    expect(result.sting).toBe(true);
    expect(state.cash).toBe(5_000_000);
    expect(state.inventory[0].qty).toBe(7);
    expect(state.heat).toBe(40);
    expect(state.stats.stings).toBe(1);
  });

  it('blocks trading once the run is over', () => {
    useGameStore.setState({ status: 'busted' });

    const result = useGameStore.getState().sellToCustomer(customer(), 'accept');

    expect(result.ok).toBe(false);
  });
});

describe('closing the day', () => {
  it('applies rent, cools heat and moves to the next day', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    useGameStore.setState({ cash: 1_000_000, heat: 50, bank: { balance: 0, transactions: [] } });

    const result = useGameStore.getState().endDay();
    const state = useGameStore.getState();

    expect(result.ok).toBe(true);
    expect(result.report?.rent).toBe(27_000);
    expect(state.cash).toBe(973_000);
    expect(state.day).toBe(2);
    expect(state.heat).toBeLessThan(50);
    expect(state.lastReport).not.toBeNull();
    expect(state.purchases).toEqual({});
  });

  it('wins the run when the retirement goal is reached', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    useGameStore.setState({ cash: 40_000_000, heat: 10, bank: { balance: 0, transactions: [] } });

    useGameStore.getState().endDay();

    expect(useGameStore.getState().status).toBe('retired');
  });

  it('restarts a finished run with a clean economy', () => {
    useGameStore.setState({ status: 'busted', statusReason: '끝', day: 9, cash: 0 });

    useGameStore.getState().restartGame();
    const state = useGameStore.getState();

    expect(state.status).toBe('playing');
    expect(state.statusReason).toBe('');
    expect(state.day).toBe(1);
    expect(state.cash).toBe(1_500_000);
    expect(state.inventory).toHaveLength(2);
    expect(state.stats.sales).toBe(0);
  });
});
