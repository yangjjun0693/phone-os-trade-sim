import { beforeEach, describe, expect, it } from 'vitest';
import { AMASON_DELIVERY_MINUTES, usdToKrw } from '@/content/amason';
import { cartCount, deliveryStage, useAmasonStore } from './amasonStore';

const placedAt = '2026-03-15T09:00:00.000Z';
const at = (minutes: number) => new Date(new Date(placedAt).getTime() + minutes * 60_000).toISOString();

describe('Amason store', () => {
  beforeEach(() => {
    useAmasonStore.getState().reset();
  });

  it('keeps quantities in the cart and drops a line at zero', () => {
    const store = useAmasonStore.getState();
    store.addToCart('cable-usbc-2m');
    store.addToCart('cable-usbc-2m', 2);
    expect(useAmasonStore.getState().cart).toEqual({ 'cable-usbc-2m': 3 });
    expect(cartCount(useAmasonStore.getState().cart)).toBe(3);

    store.setQty('cable-usbc-2m', 0);
    expect(useAmasonStore.getState().cart).toEqual({});

    store.setQty('charger-gan-65w', 4);
    store.removeFromCart('charger-gan-65w');
    expect(useAmasonStore.getState().cart).toEqual({});
  });

  it('clamps quantities to a sane range', () => {
    const store = useAmasonStore.getState();
    store.setQty('kettle-pourover', 999);
    expect(useAmasonStore.getState().cart['kettle-pourover']).toBe(99);
    store.setQty('kettle-pourover', -3);
    expect(useAmasonStore.getState().cart['kettle-pourover']).toBeUndefined();
  });

  it('records an order, prices it both ways and empties the cart', () => {
    const store = useAmasonStore.getState();
    store.addToCart('cable-usbc-2m', 2);
    store.addToCart('kettle-pourover');

    const order = store.placeOrder({
      id: 'AM-TEST01',
      placedAt,
      lines: [
        { productId: 'cable-usbc-2m', qty: 2, unitPrice: 12.99 },
        { productId: 'kettle-pourover', qty: 1, unitPrice: 29.95 },
      ],
    });

    expect(order.totalUsd).toBeCloseTo(55.93, 2);
    expect(order.totalKrw).toBe(usdToKrw(55.93));
    expect(
      (new Date(order.etaAt).getTime() - new Date(placedAt).getTime()) / 60_000,
    ).toBe(AMASON_DELIVERY_MINUTES);

    const state = useAmasonStore.getState();
    expect(state.cart).toEqual({});
    expect(state.orders).toHaveLength(1);
    expect(state.orders[0].id).toBe('AM-TEST01');
  });

  it('puts the newest order first', () => {
    const store = useAmasonStore.getState();
    store.placeOrder({ id: 'AM-1', placedAt, lines: [] });
    store.placeOrder({ id: 'AM-2', placedAt, lines: [] });
    expect(useAmasonStore.getState().orders.map((order) => order.id)).toEqual(['AM-2', 'AM-1']);
  });

  it('walks an order through its delivery stages on the game clock', () => {
    const store = useAmasonStore.getState();
    const order = store.placeOrder({
      id: 'AM-3',
      placedAt,
      lines: [{ productId: 'cable-usbc-2m', qty: 1, unitPrice: 12.99 }],
    });

    expect(deliveryStage(order, at(0))).toBe('processing');
    expect(deliveryStage(order, at(60))).toBe('shipped');
    expect(deliveryStage(order, at(AMASON_DELIVERY_MINUTES - 10))).toBe('out-for-delivery');
    expect(deliveryStage(order, at(AMASON_DELIVERY_MINUTES))).toBe('delivered');
    expect(deliveryStage(order, at(AMASON_DELIVERY_MINUTES * 3))).toBe('delivered');
  });
});
