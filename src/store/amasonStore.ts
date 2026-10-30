import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AMASON_DELIVERY_MINUTES, usdToKrw } from '@/content/amason';

/**
 * Amason's own slice of state: the shopping cart and the orders already placed.
 *
 * It is deliberately separate from the game save (`phone-os:game`): buying a
 * coffee maker is everyday retail and must not touch the grey-market loop — no
 * heat, no stock, no parcels. Orders only need to remember when they were
 * placed, so the delivery progress can be derived from the *game* clock.
 */
export interface AmasonOrderLine {
  productId: string;
  qty: number;
  /** 달러 단가(주문 시점 스냅샷). */
  unitPrice: number;
}

export interface AmasonOrder {
  id: string;
  /** 주문 시각(게임 ISO). */
  placedAt: string;
  /** 도착 예정 시각(게임 ISO). */
  etaAt: string;
  lines: AmasonOrderLine[];
  totalUsd: number;
  totalKrw: number;
}

export interface AmasonState {
  /** 품목 id → 수량. */
  cart: Record<string, number>;
  orders: AmasonOrder[];
  setQty: (productId: string, qty: number) => void;
  addToCart: (productId: string, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  /** 주문을 기록하고 장바구니를 비웁니다(결제 자체는 화면에서 처리). */
  placeOrder: (input: { lines: AmasonOrderLine[]; placedAt: string; id: string }) => AmasonOrder;
  reset: () => void;
}

const MAX_QTY = 99;
/** 한 번에 기억해 두는 주문 수. */
const MAX_ORDERS = 30;

interface PersistedAmason {
  cart: Record<string, number>;
  orders: AmasonOrder[];
}

export const AMASON_PERSIST_VERSION = 1;

const clampQty = (qty: number) => Math.max(0, Math.min(MAX_QTY, Math.round(qty)));

export const useAmasonStore = create<AmasonState>()(
  persist(
    immer((set) => ({
      cart: {},
      orders: [],

      setQty: (productId, qty) =>
        set((s) => {
          const next = clampQty(qty);
          if (next === 0) delete s.cart[productId];
          else s.cart[productId] = next;
        }),

      addToCart: (productId, qty = 1) =>
        set((s) => {
          s.cart[productId] = clampQty((s.cart[productId] ?? 0) + qty);
        }),

      removeFromCart: (productId) =>
        set((s) => {
          delete s.cart[productId];
        }),

      clearCart: () =>
        set((s) => {
          s.cart = {};
        }),

      placeOrder: ({ lines, placedAt, id }) => {
        const totalUsd = lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
        const order: AmasonOrder = {
          id,
          placedAt,
          etaAt: new Date(
            new Date(placedAt).getTime() + AMASON_DELIVERY_MINUTES * 60_000,
          ).toISOString(),
          lines,
          totalUsd: Math.round(totalUsd * 100) / 100,
          totalKrw: usdToKrw(totalUsd),
        };
        set((s) => {
          s.orders.unshift(order);
          s.orders = s.orders.slice(0, MAX_ORDERS);
          s.cart = {};
        });
        return order;
      },

      reset: () =>
        set((s) => {
          s.cart = {};
          s.orders = [];
        }),
    })),
    {
      name: 'phone-os:amason',
      version: AMASON_PERSIST_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedAmason => ({ cart: state.cart, orders: state.orders }),
    },
  ),
);

/** 장바구니에 담긴 전체 수량(아이콘 배지용). */
export function cartCount(cart: Record<string, number>): number {
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}

export type DeliveryStage = 'processing' | 'shipped' | 'out-for-delivery' | 'delivered';

/**
 * Where an order is, judged by the game clock. Purely derived, so nothing has to
 * tick while the app is closed.
 */
export function deliveryStage(order: AmasonOrder, nowIso: string): DeliveryStage {
  const now = new Date(nowIso).getTime();
  const placed = new Date(order.placedAt).getTime();
  const eta = new Date(order.etaAt).getTime();
  if (now >= eta) return 'delivered';
  if (now >= eta - 60 * 60_000) return 'out-for-delivery';
  if (now >= placed + 45 * 60_000) return 'shipped';
  return 'processing';
}

export const DELIVERY_STAGE_LABEL: Record<DeliveryStage, string> = {
  processing: 'Ordered',
  shipped: 'Shipped',
  'out-for-delivery': 'Out for delivery',
  delivered: 'Delivered',
};
