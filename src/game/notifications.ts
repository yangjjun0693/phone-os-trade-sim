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
  return list.filter((n) => !isExpired(n, now)).slice().sort(byUrgencyThenRecency);
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
