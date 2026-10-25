import { describe, expect, it } from 'vitest';
import { ADDRESSES, findAddress } from '@/content/logistics';
import {
  advanceShipments,
  arrivalHeat,
  createShipment,
  formatShipmentEta,
  minutesUntilArrival,
  rollShipmentArrival,
  shipmentTotals,
  shippingFee,
  type Shipment,
} from './shipments';

const NOW = '2026-03-15T02:00:00.000Z';
const inMinutes = (minutes: number) =>
  new Date(new Date(NOW).getTime() + minutes * 60_000).toISOString();

function shipment(overrides: Partial<Shipment> = {}): Shipment {
  return {
    id: 's1',
    marketId: 'market-nightbazaar',
    productId: 'product-pill',
    productName: '미상의 알약',
    qty: 7,
    unitCost: 4_000,
    marketPrice: 11_000,
    address: 'drop',
    fee: 0,
    orderedAt: NOW,
    etaAt: inMinutes(60),
    status: 'in_transit',
    ...overrides,
  };
}

describe('addresses', () => {
  it('trades fee against risk', () => {
    for (const address of ADDRESSES) {
      expect(address.fee).toBeGreaterThanOrEqual(0);
      expect(address.seizeChance + address.loseChance).toBeLessThan(0.5);
      expect(address.hours).toBeGreaterThan(0);
    }
    // The paid option must be the safest one, the free drop the quietest.
    const storage = findAddress('storage');
    const home = findAddress('home');
    expect(storage.fee).toBeGreaterThan(0);
    expect(storage.seizeChance).toBeLessThan(home.seizeChance);
    expect(home.heat).toBeGreaterThan(storage.heat);
    expect(findAddress('drop').heat).toBe(0);
    expect(shippingFee('storage')).toBe(storage.fee);
  });
});

describe('creating a shipment', () => {
  it('schedules an arrival inside the address window', () => {
    const created = createShipment({
      marketId: 'market-nightbazaar',
      productId: 'product-pill',
      productName: '미상의 알약',
      qty: 7,
      unitCost: 4_000,
      marketPrice: 11_000,
      address: 'drop',
      now: NOW,
    });

    expect(created.status).toBe('in_transit');
    expect(created.fee).toBe(findAddress('drop').fee);
    const minutes = minutesUntilArrival(created, NOW);
    expect(minutes).toBeGreaterThan(findAddress('drop').hours * 60 - 90);
    expect(minutes).toBeLessThan(findAddress('drop').hours * 60 + 90);
  });

  it('falls back to the default address', () => {
    const created = createShipment({
      marketId: 'm',
      productId: 'p',
      productName: 'n',
      qty: 1,
      unitCost: 1,
      marketPrice: 2,
      now: NOW,
    });
    expect(ADDRESSES.some((address) => address.id === created.address)).toBe(true);
  });
});

describe('landing', () => {
  it('usually just arrives', () => {
    const landed = rollShipmentArrival(shipment(), () => 0.99);
    expect(landed.status).toBe('arrived');
  });

  it('can be seized at a watched address', () => {
    const landed = rollShipmentArrival(shipment({ address: 'home' }), () => 0.01);
    expect(landed.status).toBe('seized');
    expect(landed.note).toBeTruthy();
  });

  it('can vanish from a drop', () => {
    // 0.1 is inside the drop's lose window but outside its seize window.
    const landed = rollShipmentArrival(shipment({ address: 'drop' }), () => 0.1);
    expect(landed.status).toBe('lost');
  });

  it('only lands parcels that are due', () => {
    const early = shipment({ id: 'early', etaAt: inMinutes(30) });
    const due = shipment({ id: 'due', etaAt: inMinutes(-1) });
    const { shipments, landed } = advanceShipments([early, due], NOW, () => 0.99);

    expect(landed.map((entry) => entry.id)).toEqual(['due']);
    expect(shipments.find((entry) => entry.id === 'early')?.status).toBe('in_transit');
    expect(shipments.find((entry) => entry.id === 'due')?.status).toBe('arrived');
  });

  it('leaves finished parcels alone', () => {
    const collected = shipment({ status: 'collected' });
    const { landed } = advanceShipments([collected], NOW, () => 0.99);
    expect(landed).toHaveLength(0);
  });

  it('adds heat when it lands at your door', () => {
    expect(arrivalHeat(shipment({ address: 'home' }))).toBe(findAddress('home').heat);
    expect(arrivalHeat(shipment({ address: 'drop' }))).toBe(0);
  });

  it('formats the wait', () => {
    expect(formatShipmentEta(shipment({ etaAt: inMinutes(200) }), NOW)).toBe('3시간 20분 남음');
    expect(formatShipmentEta(shipment({ etaAt: inMinutes(9) }), NOW)).toBe('9분 남음');
    expect(formatShipmentEta(shipment({ etaAt: inMinutes(-3) }), NOW)).toBe('도착');
  });

  it('counts parcels by status', () => {
    const totals = shipmentTotals([
      shipment({ id: 'a' }),
      shipment({ id: 'b', status: 'arrived' }),
      shipment({ id: 'c', status: 'seized' }),
      shipment({ id: 'd', status: 'collected' }),
    ]);
    expect(totals.in_transit).toBe(1);
    expect(totals.arrived).toBe(1);
    expect(totals.seized).toBe(1);
    expect(totals.collected).toBe(1);
  });
});
