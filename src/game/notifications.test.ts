import { describe, expect, it } from 'vitest';
import type { GameNotification } from '@/types';
import { badgeCounts, channelsFor, groupNotifications, isExpired, notificationsForEvent, pillNotification, shouldDeliver, visibleNotifications } from './notifications';

function n(over: Partial<GameNotification> = {}): GameNotification {
  return { id: 'x', appId: 'bank', priority: 'normal', title: 't', body: 'b', createdAt: '2026-03-14T10:00:00.000Z', read: false, ...over };
}

describe('channelsFor', () => {
  it('always logs to the centre and adds surfaces by priority', () => {
    expect(channelsFor('low')).toEqual({ center: true, banner: false, pill: false, sound: false, haptic: false });
    expect(channelsFor('normal')).toEqual({ center: true, banner: true, pill: false, sound: false, haptic: false });
    expect(channelsFor('high')).toEqual({ center: true, banner: true, pill: true, sound: false, haptic: true });
    expect(channelsFor('urgent')).toEqual({ center: true, banner: true, pill: true, sound: true, haptic: true });
  });
});

describe('expiry + ordering', () => {
  it('drops expired and sorts by priority then time', () => {
    const list = [
      n({ id: 'a', priority: 'low', createdAt: '2026-03-14T12:00:00.000Z' }),
      n({ id: 'b', priority: 'urgent', createdAt: '2026-03-14T09:00:00.000Z' }),
      n({ id: 'c', priority: 'high', createdAt: '2026-03-14T11:00:00.000Z' }),
      n({ id: 'd', createdAt: '2026-03-14T08:00:00.000Z', expiresAt: '2026-03-14T09:00:00.000Z' }),
    ];
    expect(isExpired(list[3], '2026-03-14T10:00:00.000Z')).toBe(true);
    expect(visibleNotifications(list, '2026-03-14T10:00:00.000Z').map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });
});

describe('groups + badges + pill', () => {
  it('groups by groupKey (fallback appId) and counts unread', () => {
    const list = [
      n({ id: '1', groupKey: 'msg-dal', appId: 'telegraph', read: false }),
      n({ id: '2', groupKey: 'msg-dal', appId: 'telegraph', read: true }),
      n({ id: '3', appId: 'bank', read: false }),
    ];
    const groups = groupNotifications(list);
    const dal = groups.find((g) => g.key === 'msg-dal')!;
    expect(dal.items).toHaveLength(2);
    expect(dal.unread).toBe(1);
  });

  it('counts unread per app', () => {
    expect(badgeCounts([n({ appId: 'bank' }), n({ appId: 'bank', read: true }), n({ appId: 'delivery' })])).toEqual({ bank: 1, delivery: 1 });
  });

  it('picks the newest non-expired high/urgent for the pill', () => {
    const list = [n({ id: 'a', priority: 'normal' }), n({ id: 'b', priority: 'high', createdAt: '2026-03-14T09:00:00.000Z' }), n({ id: 'c', priority: 'urgent', createdAt: '2026-03-14T08:00:00.000Z' })];
    expect(pillNotification(list, '2026-03-14T10:00:00.000Z')?.id).toBe('b');
    expect(pillNotification([n({ priority: 'normal' })], '2026-03-14T10:00:00.000Z')).toBeNull();
  });
});

describe('notificationsForEvent', () => {
  it('bank: only flagged, high when large', () => {
    const at = '2026-03-14T10:00:00.000Z';
    expect(notificationsForEvent({ type: 'bank.deposit', at, amount: 100, large: false, flagged: false })).toEqual([]);
    const [high] = notificationsForEvent({ type: 'bank.deposit', at, amount: 2_000_000, large: true, flagged: true });
    expect(high).toMatchObject({ appId: 'bank', priority: 'high', action: { type: 'openApp', appId: 'bank' } });
    const [normal] = notificationsForEvent({ type: 'bank.deposit', at, amount: 300_000, large: false, flagged: true });
    expect(normal.priority).toBe('normal');
  });

  it('messenger: normal, routes to the person’s channel app', () => {
    const [msg] = notificationsForEvent({ type: 'messenger.arrival', at: '2026-03-14T10:00:00.000Z', npcId: 'npc-dal', npcName: '달', channel: 'telegraph' });
    expect(msg).toMatchObject({ priority: 'normal', appId: 'telegraph', groupKey: 'msg-npc-dal' });
    expect(msg.action?.appId).toBe('telegraph');
  });

  it('shipment: priority by status', () => {
    const base = { type: 'shipment.landed' as const, at: '2026-03-14T10:00:00.000Z', shipmentId: 's1', productName: '젤리', qty: 4 };
    expect(notificationsForEvent({ ...base, status: 'arrived' })[0].priority).toBe('normal');
    expect(notificationsForEvent({ ...base, status: 'lost' })[0].priority).toBe('high');
    expect(notificationsForEvent({ ...base, status: 'seized' })[0].priority).toBe('urgent');
    expect(notificationsForEvent({ ...base, status: 'arrived' })[0].appId).toBe('delivery');
  });
});

describe('shouldDeliver', () => {
  const base = { existing: [], now: '2026-03-14T12:00:00.000Z', lastByKey: {}, todayCount: 0 };
  it('passes a fresh one', () => {
    expect(shouldDeliver({ ...base, notification: n({ groupKey: 'g' }) })).toBe(true);
  });
  it('blocks within the cooldown', () => {
    expect(shouldDeliver({ ...base, notification: n({ groupKey: 'g' }), lastByKey: { g: '2026-03-14T11:55:00.000Z' } })).toBe(false);
  });
  it('blocks at the daily cap', () => {
    expect(shouldDeliver({ ...base, notification: n({ groupKey: 'g' }), todayCount: 40 })).toBe(false);
  });
  it('also enforces priority in lastByKey for night: low passes only', () => {
    const night = { ...base, now: new Date(2026, 2, 14, 3, 0, 0).toISOString() };
    expect(shouldDeliver({ ...night, notification: n({ priority: 'low' }) })).toBe(true);
    expect(shouldDeliver({ ...night, notification: n({ priority: 'normal' }) })).toBe(false);
    expect(shouldDeliver({ ...night, notification: n({ priority: 'urgent' }) })).toBe(false);
  });
});
