import { addMinutes } from 'date-fns';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { InventoryItem } from '@/types';
import { PERSIST_VERSION } from './defaults';

/** Dummy starting economy so the widgets and apps have something to render. */
export const GAME_EPOCH = '2026-03-14T21:47:00.000Z';

export interface GameState {
  cash: number;
  heat: number;
  /** In-game day counter, starting at 1. */
  day: number;
  /** In-game wall clock, stored as an ISO string. */
  gameDateTime: string;
  inventory: InventoryItem[];

  setCash: (cash: number) => void;
  addCash: (delta: number) => void;
  setHeat: (heat: number) => void;
  addHeat: (delta: number) => void;
  setGameDateTime: (iso: string) => void;
  advanceGameTime: (minutes: number) => void;
  setInventory: (inventory: InventoryItem[]) => void;
  reset: () => void;
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
    })),
    {
      name: 'phone-os:game',
      version: PERSIST_VERSION,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
