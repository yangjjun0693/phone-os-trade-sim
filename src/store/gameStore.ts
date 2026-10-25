import { addDays, addMinutes } from 'date-fns';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  InventoryItem,
  IdentityState,
  AppIdentityMap,
  MarketStatus,
} from '@/types';
import { PERSIST_VERSION } from './defaults';
import { assessDeposit, validateAmount, type BankTransaction } from '@/game/bank';
import {
  resolveSteakBet,
  validateSteakBet,
  type SteakBet,
  type SteakGameId,
  type SteakOutcome,
} from '@/game/steak';
import { START_BANK, START_CASH, START_CHIPS } from '@/content/economy';
import {
  RETIRE_GOAL,
  addToInventory,
  removeFromInventory,
  resolveCounter,
  resolveDayEnd,
  resolvePurchase,
  totalWealth,
  type CustomerOffer,
  type DayReport,
  type GameStatus,
  type MarketOffer,
  type PurchaseOutcome,
} from '@/game/trade';

/** Dummy starting economy so the widgets and apps have something to render. */
export const GAME_EPOCH = '2026-03-14T21:47:00.000Z';

/** Browser history entry stored in gameStore. */
export interface BrowserHistoryEntry {
  id: string;
  appId: string; // which browser: chroma, sailor, shade
  url: string;
  title: string;
  visitedAt: string; // game time ISO
}

/** Saved identities for each app. */
export interface IdentityMap extends AppIdentityMap {}

export interface BankState {
  balance: number;
  transactions: BankTransaction[];
}

export interface BankResult {
  ok: boolean;
  error?: string;
  flagged?: boolean;
  reason?: string | null;
}

/** One settled steak bet, kept for the in-app history list. */
export interface SteakBetRecord {
  id: string;
  game: SteakGameId;
  amount: number;
  won: boolean;
  multiplier: number;
  payout: number;
  detail: string;
  at: string;
}

export interface SteakState {
  chips: number;
  bets: SteakBetRecord[];
}

export interface SteakPlayResult {
  ok: boolean;
  error?: string;
  outcome?: SteakOutcome;
}

/** Lifetime counters for the run, shown on the game-over screen. */
export interface GameStats {
  sales: number;
  revenue: number;
  unitsSold: number;
  spent: number;
  stings: number;
}

export interface BuyResult {
  ok: boolean;
  error?: string;
  outcome?: PurchaseOutcome;
}

export interface SellResult {
  ok: boolean;
  error?: string;
  total?: number;
  message?: string;
  /** The buyer was an undercover officer. */
  sting?: boolean;
  /** A counter-offer was rejected and the customer walked. */
  left?: boolean;
}

export interface DayEndResult {
  ok: boolean;
  error?: string;
  report?: DayReport;
}

export type CustomerAction = 'accept' | 'counter';

export interface GameState {
  /** The player's in-game name. */
  playerName: string;
  cash: number;
  heat: number;
  /** In-game day counter, starting at 1. */
  day: number;
  /** In-game wall clock, stored as an ISO string. */
  gameDateTime: string;
  inventory: InventoryItem[];
  /** Browser visit history (shared across browsers). */
  browserHistory: BrowserHistoryEntry[];
  /** Identity state per app. */
  identities: IdentityMap;
  /** Real-name bank account (초콜렛뱅크). */
  bank: BankState;
  /** Fictional casino chips (steak). */
  steak: SteakState;
  /** Run state. Reaching heat 100 or day 30 without the goal ends the run. */
  status: GameStatus;
  statusReason: string;
  /** Offer id -> units already bought today. Reset when the day closes. */
  purchases: Record<string, number>;
  /** Onion market ids the player has learned about (usually via social apps). */
  discoveredMarkets: string[];
  stats: GameStats;
  /** The most recent day-end report, shown in the Trade app. */
  lastReport: DayReport | null;

  setPlayerName: (name: string) => void;
  setCash: (cash: number) => void;
  addCash: (delta: number) => void;
  setHeat: (heat: number) => void;
  addHeat: (delta: number) => void;
  setGameDateTime: (iso: string) => void;
  advanceGameTime: (minutes: number) => void;
  setInventory: (inventory: InventoryItem[]) => void;
  reset: () => void;
  // Browser history
  addBrowserHistory: (entry: Omit<BrowserHistoryEntry, 'id' | 'visitedAt'>) => void;
  clearBrowserHistory: (appId?: string) => void;
  // Identity
  setIdentity: (appId: string, identity: IdentityState) => void;
  switchIdentity: (appId: string, kind: 'realname' | 'alias') => void;
  logoutIdentity: (appId: string) => void;
  // Bank
  bankDeposit: (amount: number) => BankResult;
  bankWithdraw: (amount: number) => BankResult;
  // steak
  setSteak: (steak: SteakState) => void;
  steakDeposit: (amount: number) => BankResult;
  steakWithdraw: (amount: number) => BankResult;
  playSteakBet: (bet: SteakBet, amount: number) => SteakPlayResult;
  // Core trading loop
  buyMarketOffer: (offer: MarketOffer, status: MarketStatus) => BuyResult;
  /** Learn an onion address (no-op if it is already known). */
  discoverMarket: (marketId: string) => void;
  sellToCustomer: (offer: CustomerOffer, action: CustomerAction) => SellResult;
  endDay: () => DayEndResult;
  restartGame: () => void;
}

function createInitialState() {
  return {
    playerName: '이지훈',
    cash: START_CASH,
    heat: 12,
    day: 1,
    gameDateTime: GAME_EPOCH,
    inventory: [
      {
        id: 'item-1',
        productId: 'product-pill',
        name: '미상의 알약',
        qty: 6,
        unitCost: 4_000,
        marketPrice: 11_000,
      },
      {
        id: 'item-2',
        productId: 'product-card',
        name: '무표정 카드',
        qty: 2,
        unitCost: 26_000,
        marketPrice: 72_000,
      },
    ] satisfies InventoryItem[],
    browserHistory: [],
    identities: {},
    bank: {
      balance: START_BANK,
      transactions: [
        {
          id: 'tx-seed-1',
          kind: 'payment',
          amount: -4300,
          memo: '24시 편의점',
          at: '2026-03-14T14:20:00.000Z',
        },
        {
          id: 'tx-seed-2',
          kind: 'transfer',
          amount: -450000,
          memo: '월세 이체',
          at: '2026-03-10T00:10:00.000Z',
        },
        {
          id: 'tx-seed-3',
          kind: 'payment',
          amount: -33000,
          memo: '통신요금',
          at: '2026-03-08T02:00:00.000Z',
        },
        {
          id: 'tx-seed-4',
          kind: 'transfer',
          amount: 520000,
          memo: '급여 입금',
          at: '2026-03-05T01:00:00.000Z',
        },
      ] satisfies BankTransaction[],
    },
    steak: {
      chips: START_CHIPS,
      bets: [],
    } satisfies SteakState,
    status: 'playing' as GameStatus,
    statusReason: '',
    purchases: {} as Record<string, number>,
    discoveredMarkets: ['market-nightbazaar'],
    stats: {
      sales: 0,
      revenue: 0,
      unitsSold: 0,
      spent: 0,
      stings: 0,
    } satisfies GameStats,
    lastReport: null as DayReport | null,
  };
}

const initialState = createInitialState();

/** Data-only slice written to localStorage (actions are never persisted). */
type PersistedGame = Pick<
  GameState,
  | 'playerName'
  | 'cash'
  | 'heat'
  | 'day'
  | 'gameDateTime'
  | 'inventory'
  | 'browserHistory'
  | 'identities'
  | 'bank'
  | 'steak'
  | 'status'
  | 'statusReason'
  | 'purchases'
  | 'stats'
  | 'lastReport'
  | 'discoveredMarkets'
>;

export const useGameStore = create<GameState>()(
  persist(
    immer((set) => ({
      ...initialState,

      setPlayerName: (name) =>
        set((s) => {
          const trimmed = name.trim();
          if (trimmed) s.playerName = trimmed.slice(0, 20);
        }),
      setCash: (cash) =>
        set((s) => {
          s.cash = Math.max(0, Math.round(cash));
        }),
      addCash: (delta) =>
        set((s) => {
          s.cash = Math.max(0, Math.round(s.cash + delta));
        }),
      setHeat: (heat) =>
        set((s) => {
          s.heat = Math.min(100, Math.max(0, Math.round(heat)));
        }),
      addHeat: (delta) =>
        set((s) => {
          s.heat = Math.min(100, Math.max(0, Math.round(s.heat + delta)));
        }),
      setGameDateTime: (iso) =>
        set((s) => {
          s.gameDateTime = iso;
        }),
      advanceGameTime: (minutes) =>
        set((s) => {
          s.gameDateTime = addMinutes(new Date(s.gameDateTime), minutes).toISOString();
        }),
      setInventory: (inventory) =>
        set((s) => {
          s.inventory = inventory;
        }),
      reset: () =>
        set((s) => {
          const name = s.playerName;
          Object.assign(s, createInitialState());
          s.playerName = name;
        }),
      // Browser history
      addBrowserHistory: (entry) =>
        set((s) => {
          const last = s.browserHistory[0];
          // Dev StrictMode double-invokes effects; keep one row per consecutive visit.
          if (last && last.appId === entry.appId && last.url === entry.url) {
            last.visitedAt = s.gameDateTime;
            return;
          }
          const newEntry: BrowserHistoryEntry = {
            ...entry,
            id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            visitedAt: s.gameDateTime,
          };
          s.browserHistory = [newEntry, ...s.browserHistory].slice(0, 200);
        }),
      clearBrowserHistory: (appId) =>
        set((s) => {
          if (appId) {
            s.browserHistory = s.browserHistory.filter((h) => h.appId !== appId);
          } else {
            s.browserHistory = [];
          }
        }),
      // Identity
      setIdentity: (appId, identity) =>
        set((s) => {
          s.identities[appId] = identity;
        }),
      switchIdentity: (appId, kind) =>
        set((s) => {
          const current = s.identities[appId] ?? {
            active: 'alias' as const,
            loggedIn: false,
            lastSwitchedAt: null,
          };
          s.identities[appId] = {
            ...current,
            active: kind,
            loggedIn: true,
            lastSwitchedAt: s.gameDateTime,
          };
        }),
      logoutIdentity: (appId) =>
        set((s) => {
          delete s.identities[appId];
        }),
      // Bank
      bankDeposit: (amount) => {
        let result: BankResult = { ok: false };
        set((s) => {
          const error = validateAmount(amount, s.cash);
          if (error) {
            result = { ok: false, error };
            return;
          }
          const assessment = assessDeposit(amount, s.bank.transactions, s.gameDateTime);
          s.cash -= amount;
          s.bank.balance += amount;
          s.bank.transactions = [
            {
              id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              kind: 'deposit' as const,
              amount,
              memo: '현금 입금',
              at: s.gameDateTime,
              flagged: assessment.flagged || undefined,
            },
            ...s.bank.transactions,
          ].slice(0, 60);
          if (assessment.heatDelta > 0) {
            s.heat = Math.min(100, Math.max(0, Math.round(s.heat + assessment.heatDelta)));
          }
          result = { ok: true, flagged: assessment.flagged, reason: assessment.reason };
        });
        return result;
      },
      bankWithdraw: (amount) => {
        let result: BankResult = { ok: false };
        set((s) => {
          const error = validateAmount(amount, s.bank.balance);
          if (error) {
            result = { ok: false, error };
            return;
          }
          s.bank.balance -= amount;
          s.cash += amount;
          s.bank.transactions = [
            {
              id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              kind: 'withdraw' as const,
              amount: -amount,
              memo: '현금 출금',
              at: s.gameDateTime,
            },
            ...s.bank.transactions,
          ].slice(0, 60);
          result = { ok: true };
        });
        return result;
      },
      // steak
      setSteak: (steak) =>
        set((s) => {
          s.steak = {
            chips: Math.max(0, Math.round(steak.chips)),
            bets: steak.bets.slice(0, 50),
          };
        }),
      steakDeposit: (amount) => {
        let result: BankResult = { ok: false };
        set((s) => {
          const error = validateAmount(amount, s.cash);
          if (error) {
            result = { ok: false, error };
            return;
          }
          s.cash -= amount;
          s.steak.chips += amount;
          result = { ok: true };
        });
        return result;
      },
      steakWithdraw: (amount) => {
        let result: BankResult = { ok: false };
        set((s) => {
          const error = validateAmount(amount, s.steak.chips);
          if (error) {
            result = { ok: false, error };
            return;
          }
          s.steak.chips -= amount;
          s.cash += amount;
          if (s.status === 'playing' && totalWealth(s.cash, s.bank.balance) >= RETIRE_GOAL) {
            s.status = 'retired';
            s.statusReason = '카지노에서 건진 돈까지 더하니 목표 금액을 넘겼다. 이제 이 생활을 접을 수 있다.';
          }
          result = { ok: true };
        });
        return result;
      },
      playSteakBet: (bet, amount) => {
        let result: SteakPlayResult = { ok: false };
        set((s) => {
          const error = validateSteakBet(amount, s.steak.chips);
          if (error) {
            result = { ok: false, error };
            return;
          }
          const outcome = resolveSteakBet(bet, amount, Math.random);
          s.steak.chips = s.steak.chips - amount + outcome.payout;
          s.steak.bets = [
            {
              id: `bet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              game: outcome.game,
              amount,
              won: outcome.won,
              multiplier: outcome.multiplier,
              payout: outcome.payout,
              detail: outcome.detail,
              at: s.gameDateTime,
            },
            ...s.steak.bets,
          ].slice(0, 50);
          result = { ok: true, outcome };
        });
        return result;
      },
      discoverMarket: (marketId) =>
        set((s) => {
          if (!s.discoveredMarkets.includes(marketId)) {
            s.discoveredMarkets.push(marketId);
          }
        }),
      // Core trading loop
      buyMarketOffer: (offer, marketStatus) => {
        let result: BuyResult = { ok: false };
        set((s) => {
          if (s.status !== 'playing') {
            result = { ok: false, error: '이번 판은 이미 끝났습니다.' };
            return;
          }

          const alreadyBought = s.purchases[offer.id] ?? 0;
          if (alreadyBought >= offer.qty) {
            result = { ok: false, error: '오늘 몫은 이미 매입했습니다.' };
            return;
          }

          const total = Math.round(offer.unitPrice * offer.qty);
          if (total > s.cash) {
            result = { ok: false, error: '현금이 부족합니다.' };
            return;
          }

          const outcome = resolvePurchase(offer, marketStatus, Math.random);
          s.cash -= total;
          s.stats.spent += total;
          s.purchases[offer.id] = alreadyBought + offer.qty;
          s.heat = Math.min(100, Math.max(0, s.heat + outcome.heatDelta));

          if (outcome.deliveredQty > 0) {
            s.inventory = addToInventory(s.inventory, {
              productId: offer.productId,
              name: offer.name,
              qty: outcome.deliveredQty,
              unitCost: offer.unitPrice,
              marketPrice: offer.marketPrice,
            });
          }

          if (s.heat >= 100) {
            s.status = 'busted';
            s.statusReason = '무리한 거래가 추적망을 불렀다. 문 밖에서 발소리가 들린다.';
          }

          result = { ok: true, outcome };
        });
        return result;
      },
      sellToCustomer: (offer, action) => {
        let result: SellResult = { ok: false };
        set((s) => {
          if (s.status !== 'playing') {
            result = { ok: false, error: '이번 판은 이미 끝났습니다.' };
            return;
          }

          const item = s.inventory.find((entry) => entry.id === offer.itemId);
          if (!item || item.qty < offer.qty) {
            result = { ok: false, error: '재고가 부족합니다.' };
            return;
          }

          let unitPrice = offer.unitPrice;
          if (action === 'counter') {
            const counter = resolveCounter(offer, Math.random);
            s.gameDateTime = addMinutes(new Date(s.gameDateTime), 5).toISOString();
            if (!counter.accepted) {
              result = { ok: false, left: true, message: counter.message };
              return;
            }
            unitPrice = counter.unitPrice;
          }

          const total = Math.round(unitPrice * offer.qty);
          s.inventory = removeFromInventory(s.inventory, offer.itemId, offer.qty);

          if (offer.kind === 'undercover') {
            s.stats.stings += 1;
            s.heat = Math.min(100, Math.max(0, s.heat + 30));
            if (s.heat >= 100) {
              s.status = 'busted';
              s.statusReason = '손님이 배지를 꺼냈다. 물건은 압수되고, 도망칠 곳도 없다.';
            }
            result = {
              ok: false,
              sting: true,
              message: '손님이 배지를 꺼냈다. 물건은 압수되고, 겨우 빠져나왔다.',
            };
            return;
          }

          s.cash += total;
          s.heat = Math.min(100, Math.max(0, s.heat + 1 + (offer.qty >= 4 ? 1 : 0)));
          s.stats.sales += 1;
          s.stats.revenue += total;
          s.stats.unitsSold += offer.qty;
          s.gameDateTime = addMinutes(new Date(s.gameDateTime), 15).toISOString();

          if (s.heat >= 100) {
            s.status = 'busted';
            s.statusReason = '거래가 잦아졌다. 결국 추적망에 걸리고 말았다.';
          } else if (totalWealth(s.cash, s.bank.balance) >= RETIRE_GOAL) {
            s.status = 'retired';
            s.statusReason = '목표 금액을 채웠다. 이제 이 생활을 접을 수 있다.';
          }

          result = {
            ok: true,
            total,
            message: `${offer.name} ${offer.qty}개를 ₩${total.toLocaleString('ko-KR')}에 넘겼습니다.`,
          };
        });
        return result;
      },
      endDay: () => {
        let result: DayEndResult = { ok: false };
        set((s) => {
          if (s.status !== 'playing') {
            result = { ok: false, error: '이번 판은 이미 끝났습니다.' };
            return;
          }

          const report = resolveDayEnd(
            {
              day: s.day,
              cash: s.cash,
              heat: s.heat,
              bankBalance: s.bank.balance,
            },
            Math.random,
          );

          s.cash = report.cashAfter;
          s.bank.balance = report.bankAfter;
          s.heat = report.heatAfter;
          s.lastReport = report;
          s.purchases = {};
          s.day = s.day + 1;
          s.gameDateTime = addDays(new Date(s.gameDateTime), 1).toISOString();

          if (report.paidFromBank > 0) {
            s.bank.transactions = [
              {
                id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                kind: 'payment' as const,
                amount: -report.paidFromBank,
                memo: '월세 자동이체',
                at: s.gameDateTime,
              },
              ...s.bank.transactions,
            ].slice(0, 60);
          }

          if (report.status !== 'playing') {
            s.status = report.status;
            s.statusReason = report.reason;
          }

          result = { ok: true, report };
        });
        return result;
      },
      restartGame: () =>
        set((s) => {
          const name = s.playerName;
          Object.assign(s, createInitialState());
          s.playerName = name;
        }),
    })),
    {
      name: 'phone-os:game',
      version: PERSIST_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Persist only durable game data; actions are recreated on every load.
      partialize: (state): PersistedGame => ({
        playerName: state.playerName,
        cash: state.cash,
        heat: state.heat,
        day: state.day,
        gameDateTime: state.gameDateTime,
        inventory: state.inventory,
        browserHistory: state.browserHistory,
        identities: state.identities,
        bank: state.bank,
        steak: state.steak,
        status: state.status,
        statusReason: state.statusReason,
        purchases: state.purchases,
        stats: state.stats,
        lastReport: state.lastReport,
        discoveredMarkets: state.discoveredMarkets,
      }),
      migrate: (persisted) => {
        const previous = (persisted ?? {}) as Partial<PersistedGame>;
        const base = createInitialState();
        return {
          ...base,
          ...previous,
          steak: {
            chips: previous.steak?.chips ?? base.steak.chips,
            bets: previous.steak?.bets ?? [],
          },
          status: previous.status ?? 'playing',
          statusReason: previous.statusReason ?? '',
          purchases: previous.purchases ?? {},
          stats: { ...base.stats, ...previous.stats },
          lastReport: previous.lastReport ?? null,
          discoveredMarkets: previous.discoveredMarkets ?? base.discoveredMarkets,
        };
      },
    },
  ),
);
