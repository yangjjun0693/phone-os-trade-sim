import type { GameNotification, NotificationPriority } from '@/types';

/** Which surfaces a notification of a given priority is allowed to reach. */
export interface NotificationChannels {
  center: boolean;
  banner: boolean;
  pill: boolean;
  sound: boolean;
  haptic: boolean;
}

/** A bundle of notifications that share a group key. */
export interface NotificationGroup {
  key: string;
  appId?: string;
  latest: GameNotification;
  items: GameNotification[];
  unread: number;
}

/** Sort weight: urgent wins, low loses. */
const PRIORITY_RANK: Record<NotificationPriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  urgent: 3,
};

/**
 * The notification centre always receives everything. Louder surfaces are
 * reserved for higher priorities so the player is only interrupted when it
 * actually matters.
 */
export function channelsFor(p: NotificationPriority): NotificationChannels {
  const rank = PRIORITY_RANK[p];
  return {
    center: true,
    banner: rank >= PRIORITY_RANK.normal,
    pill: rank >= PRIORITY_RANK.high,
    sound: rank >= PRIORITY_RANK.urgent,
    haptic: rank >= PRIORITY_RANK.high,
  };
}

/** True once an expiring notification has passed its `expiresAt` (ISO compare). */
export function isExpired(n: GameNotification, now: string): boolean {
  return Boolean(n.expiresAt) && n.expiresAt! <= now;
}

/** Shared ordering: higher priority first, then most recent first. */
function byUrgencyThenRecency(a: GameNotification, b: GameNotification): number {
  const byPriority = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
  if (byPriority !== 0) return byPriority;
  return b.createdAt.localeCompare(a.createdAt);
}

/** Non-expired notifications, loudest and newest first. */
export function visibleNotifications(list: GameNotification[], now: string): GameNotification[] {
  // `filter` already hands back a fresh array, so it can be sorted in place.
  return list.filter((n) => !isExpired(n, now)).sort(byUrgencyThenRecency);
}

/** Falls back from groupKey to appId to the notification's own id. */
function groupKeyFor(n: GameNotification): string {
  return n.groupKey ?? n.appId ?? n.id;
}

/** One group per key, each carrying its items, newest first, and unread count. */
export function groupNotifications(list: GameNotification[]): NotificationGroup[] {
  const groups = new Map<string, GameNotification[]>();
  for (const n of list) {
    const key = groupKeyFor(n);
    const bucket = groups.get(key);
    if (bucket) bucket.push(n);
    else groups.set(key, [n]);
  }

  const result: NotificationGroup[] = [];
  for (const [key, items] of groups) {
    const sorted = items.slice().sort(byUrgencyThenRecency);
    const unread = items.reduce((count, n) => (n.read ? count : count + 1), 0);
    result.push({
      key,
      appId: sorted[0].appId,
      latest: sorted[0],
      items: sorted,
      unread,
    });
  }
  return result;
}

/** Unread notification count per app id. */
export function badgeCounts(list: GameNotification[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const n of list) {
    if (n.read || !n.appId) continue;
    counts[n.appId] = (counts[n.appId] ?? 0) + 1;
  }
  return counts;
}

/**
 * The single notification worth showing as a pill: the newest non-expired
 * high/urgent item, so a fresh alert always replaces a stale loud one.
 */
export function pillNotification(list: GameNotification[], now: string): GameNotification | null {
  const candidates = list.filter(
    (n) => !isExpired(n, now) && (n.priority === 'high' || n.priority === 'urgent'),
  );
  if (candidates.length === 0) return null;
  return candidates.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

/** Domain events that can raise a notification. `at` is an ISO game-time stamp. */
export type GameEvent =
  | { type: 'bank.deposit'; at: string; amount: number; large: boolean; flagged: boolean }
  | { type: 'messenger.arrival'; at: string; npcId: string; npcName: string; channel: 'telegraph' | 'phone' }
  | { type: 'shipment.landed'; at: string; shipmentId: string; status: 'arrived' | 'seized' | 'lost'; productName: string; qty: number };

const HOUR_MS = 60 * 60 * 1000;
const TWO_HOURS_MS = 2 * HOUR_MS;
const SIX_HOURS_MS = 6 * HOUR_MS;
const DAY_MS = 24 * HOUR_MS;

/** ISO stamp `hours` after `at`, used for notification expiry. */
function after(at: string, ms: number): string {
  return new Date(new Date(at).getTime() + ms).toISOString();
}

/** Stable, deterministic id: no randomness so tests and de-dupes stay predictable. */
function idFor(event: GameEvent): string {
  switch (event.type) {
    case 'bank.deposit':
      return `ntf-bank.deposit-${event.at}`;
    case 'messenger.arrival':
      return `ntf-messenger.arrival-${event.npcId}`;
    case 'shipment.landed':
      return `ntf-shipment.landed-${event.shipmentId}`;
  }
}

/** The group key an event's notifications collapse under. */
export function eventGroupKey(e: GameEvent): string {
  switch (e.type) {
    case 'bank.deposit':
      return 'bank.deposit';
    case 'messenger.arrival':
      return `msg-${e.npcId}`;
    case 'shipment.landed':
      return 'shipment';
  }
}

/**
 * Turn a domain event into zero or more notifications. Pure: same event in,
 * same notifications out. Bank deposits only speak up when `flagged`.
 */
export function notificationsForEvent(event: GameEvent): GameNotification[] {
  switch (event.type) {
    case 'bank.deposit': {
      if (!event.flagged) return [];
      return [
        {
          id: idFor(event),
          appId: 'bank',
          priority: event.large ? 'high' : 'normal',
          title: '초콜렛뱅크',
          body: event.large ? '고액 입금이 감지되었습니다.' : '짧은 시간에 입금이 반복되었습니다.',
          action: { type: 'openApp', appId: 'bank' },
          createdAt: event.at,
          read: false,
          groupKey: 'bank.deposit',
          expiresAt: after(event.at, DAY_MS),
        },
      ];
    }
    case 'messenger.arrival': {
      const appId = event.channel === 'telegraph' ? 'telegraph' : 'messagesCall';
      return [
        {
          id: idFor(event),
          appId,
          priority: 'normal',
          title: '새 메시지',
          body: `${event.npcName} 님의 메시지가 도착했습니다.`,
          action: { type: 'openApp', appId },
          createdAt: event.at,
          read: false,
          groupKey: `msg-${event.npcId}`,
          expiresAt: after(event.at, TWO_HOURS_MS),
        },
      ];
    }
    case 'shipment.landed': {
      const priority: NotificationPriority =
        event.status === 'seized' ? 'urgent' : event.status === 'lost' ? 'high' : 'normal';
      const title = event.status === 'seized' ? '압수' : event.status === 'lost' ? '분실' : '수령 대기';
      const body =
        event.status === 'seized'
          ? `${event.productName} ${event.qty}개가 압수되었습니다.`
          : event.status === 'lost'
            ? `${event.productName} ${event.qty}개가 분실되었습니다.`
            : `${event.productName} ${event.qty}개가 도착했습니다.`;
      return [
        {
          id: idFor(event),
          appId: 'delivery',
          priority,
          title,
          body,
          action: { type: 'openApp', appId: 'delivery' },
          createdAt: event.at,
          read: false,
          groupKey: 'shipment',
          expiresAt: after(event.at, SIX_HOURS_MS),
        },
      ];
    }
  }
}

/** Everything the spam guard needs to decide on one notification. */
export interface SpamInput {
  notification: GameNotification;
  existing: readonly GameNotification[];
  now: string;
  lastByKey: Readonly<Record<string, string>>;
  todayCount: number;
  cooldownMinutes?: number;
  dailyCap?: number;
}

const NIGHT_START_HOUR = 0;
const NIGHT_END_HOUR = 6;
const DEFAULT_COOLDOWN_MINUTES = 10;
const DEFAULT_DAILY_CAP = 40;

/** Group key an incoming notification would land under. */
function groupKeyOf(n: GameNotification): string {
  return n.groupKey ?? n.appId ?? n.id;
}

/**
 * Spam guard: silence non-low alerts overnight, dedupe a group within its
 * cooldown, and hard-stop once the daily budget is spent.
 */
export function shouldDeliver(input: SpamInput): boolean {
  const { notification, now, lastByKey, todayCount } = input;
  const cooldownMinutes = input.cooldownMinutes ?? DEFAULT_COOLDOWN_MINUTES;
  const dailyCap = input.dailyCap ?? DEFAULT_DAILY_CAP;

  const hour = new Date(now).getHours();
  const isNight = hour >= NIGHT_START_HOUR && hour < NIGHT_END_HOUR;
  if (isNight && notification.priority !== 'low') return false;

  const key = groupKeyOf(notification);
  const last = lastByKey[key];
  if (last) {
    const elapsed = new Date(now).getTime() - new Date(last).getTime();
    // A backwards clock (a fresh run resets game time while the persisted
    // `lastByKey` survives) must never wedge the guard: a `last` that sits in
    // the future counts as a cooldown that has already passed.
    if (elapsed >= 0 && elapsed < cooldownMinutes * 60 * 1000) return false;
  }

  if (todayCount >= dailyCap) return false;

  return true;
}
