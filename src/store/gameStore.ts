import { addMinutes } from 'date-fns';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { InventoryItem, IdentityState, AppIdentityMap } from '@/types';
import { PERSIST_VERSION } from './defaults';

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

export interface GameState {
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
}

const initialState = {
  cash: 1240,
  heat: 12,
  day: 1,
  gameDateTime: GAME_EPOCH,
  inventory: [
    { id: 'item-1', name: '미상의 알약 (샘플)', qty: 6, unitCost: 12 },
    { id: 'item-2', name: '미상의 카드 (샘플)', qty: 2, unitCost: 40 },
  ] satisfies InventoryItem[],
  browserHistory: [],
  identities: {},
};

export const useGameStore = create<GameState>()(
  persist(
    immer((set) => ({
      ...initialState,

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
          Object.assign(s, initialState);
        }),
      // Browser history
      addBrowserHistory: (entry) =>
        set((s) => {
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
          const current = s.identities[appId] ?? { active: 'alias' as const, loggedIn: false, lastSwitchedAt: null };
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
    })),{      name: 'phone-os:game',
      version: PERSIST_VERSION,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
