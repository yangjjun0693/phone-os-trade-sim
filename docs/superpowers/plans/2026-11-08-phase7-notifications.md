# Phase 7 — 알림 시스템 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 게임 사건을 이벤트 버스로 흘려 알림·배지·pill 로 표현하는 알림 시스템을 만들고, 은행·메신저·배송 3종 트리거에 연결한다.

**Architecture:** 게임 스토어가 `emitGameEvent` 로 사건만 던지고, 순수 빌더(`notificationsForEvent`)가 알림으로 번역하며, `osStore.notify` 가 스팸 규칙을 적용해 저장한다. `App`의 브리지가 그 결과로 햅틱/사운드를 건다. 표현은 알림센터·잠금화면·아이콘 배지·다이나믹 아일랜드 pill.

**Tech Stack:** React 18, TypeScript(strict), Zustand(+immer, persist), Framer Motion, @use-gesture/react, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-07-phase7-notifications-design.md`

## Global Constraints

- `src/game/*` 는 **순수**: React·store 를 import 하지 않는다. (데이터 `@/data` 정적 import 는 허용하되, 이 계획의 빌더는 이벤트에 필요한 값을 이미 담아 받으므로 불필요)
- 한국어 UI, 통화 ₩. 사용자 노출 문구는 기존 톤(간결한 존댓말/평서) 유지.
- 스팸 기본값: 쿨다운 **10 게임분**, 일일 상한 **40**, 야간(게임 00:00–05:59)에는 `low` 만.
- 알림은 **상태를 바꾸지 않는다**. 놓쳐도 손해가 없다(센터 로그).
- 알림 저장 스키마 `phone-os:os` **v11 → v12** (기존 세이브는 잃지 않는다).
- 사운드는 Phase 8 전까지 `sound.play('notify')` 가 no-op(이미 그럼).
- 모든 테스트 파일은 기존 관례대로 `src/**/*.test.ts(x)`. 검증: `npm run typecheck && npx vitest run <file> && npm test && npm run build`.

## Review Focus

- **동의 꺼짐(`tutorialStore.notifications === false`)**: 알림은 저장하지 않되 앱은 정상 동작 — 소비자가 깨지지 않아야 한다. (Task 3 테스트)
- **게임 시각 03:00(야간)**: `normal`/`high`/`urgent` 는 억제되고 `low` 만 통과 — 야간 pill/햅틱이 뜨면 실패. (Task 3 테스트)
- **같은 그룹 연속 발생(10분 내 3회)**: 첫 건만 표현되고 나머지는 쿨다운으로 버려진다. (Task 3 테스트)
- **기존 v11 세이브 로드**: 크래시 없이 `notifications: []`, `notificationMeta` 기본값으로 뜬다. (Task 3 테스트)
- **`appId` 없는/알 수 없는 알림 탭**: 크래시 없이 그냥 닫힌다. (Task 5 테스트)

---

### Task 1: 알림 모델 + 순수 규칙

**Files:**
- Modify: `src/types/index.ts` (`GameNotification` 교체 + `NotificationPriority`, `NotificationAction`)
- Create: `src/game/notifications.ts`
- Test: `src/game/notifications.test.ts`

**Interfaces:**
- Produces:
  - `type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'`
  - `interface NotificationAction { type: 'openApp'; appId: string; targetId?: string }`
  - `interface GameNotification { id: string; appId?: string; priority: NotificationPriority; title: string; body: string; action?: NotificationAction; createdAt: string; read: boolean; groupKey?: string; expiresAt?: string }`
  - `interface NotificationChannels { center: boolean; banner: boolean; pill: boolean; sound: boolean; haptic: boolean }`
  - `function channelsFor(p: NotificationPriority): NotificationChannels`
  - `function isExpired(n: GameNotification, now: string): boolean`
  - `function visibleNotifications(list, now): GameNotification[]`
  - `interface NotificationGroup { key: string; appId?: string; latest: GameNotification; items: GameNotification[]; unread: number }`
  - `function groupNotifications(list): NotificationGroup[]`
  - `function badgeCounts(list): Record<string, number>`
  - `function pillNotification(list, now): GameNotification | null`

- [ ] **Step 1: Write the failing test** (`src/game/notifications.test.ts`)

```ts
import { describe, expect, it } from 'vitest';
import type { GameNotification } from '@/types';
import { badgeCounts, channelsFor, groupNotifications, isExpired, pillNotification, visibleNotifications } from './notifications';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/notifications.test.ts`
Expected: FAIL — cannot resolve `./notifications`.

- [ ] **Step 3: Implement** `src/types/index.ts` (replace `GameNotification`) and `src/game/notifications.ts`

`channelsFor` returns the §8.5 mapping above (`center` always true; `banner` = ≥normal; `pill`/`haptic` = ≥high; `sound` = urgent). `isExpired(n, now)` = `!!n.expiresAt && n.expiresAt <= now`. `visibleNotifications` filters `!isExpired` then sorts by priority rank (urgent=3…low=0) desc, then `createdAt` desc. `groupNotifications` keys on `groupKey ?? appId ?? id`, `latest` = first after the same sort, `unread` = items with `!read`. `badgeCounts` counts unread per `appId`. `pillNotification` = first of `visibleNotifications(...)` whose priority is high/urgent, else null.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/notifications.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`
```bash
git add src/types/index.ts src/game/notifications.ts src/game/notifications.test.ts
git commit -m "feat(notify): notification model and pure rules"
```

---

### Task 2: 이벤트 버스 + 트리거 빌더

**Files:**
- Create: `src/lib/notificationBus.ts`
- Test: `src/lib/notificationBus.test.ts`
- Modify: `src/game/notifications.ts` (add `GameEvent` + `notificationsForEvent` + `shouldDeliver`)
- Test: `src/game/notifications.test.ts` (extend)

**Interfaces:**
- Consumes: Task 1's `GameNotification`, `channelsFor`.
- Produces:
  - `type GameEvent = { type: 'bank.deposit'; at: string; amount: number; large: boolean; flagged: boolean } | { type: 'messenger.arrival'; at: string; npcId: string; npcName: string; channel: 'telegraph' | 'phone' } | { type: 'shipment.landed'; at: string; shipmentId: string; status: 'arrived' | 'seized' | 'lost'; productName: string; qty: number }`
  - `function notificationsForEvent(event: GameEvent): GameNotification[]`
  - `interface SpamInput { notification: GameNotification; existing: readonly GameNotification[]; now: string; lastByKey: Readonly<Record<string, string>>; todayCount: number; cooldownMinutes?: number; dailyCap?: number }`
  - `function shouldDeliver(input: SpamInput): boolean`
  - `function eventGroupKey(e: GameEvent): string`
  - `function onGameEvent(listener: (e: GameEvent) => void): () => void`
  - `function emitGameEvent(e: GameEvent): void`

- [ ] **Step 1: Write failing tests**

`src/game/notifications.test.ts` (append):

```ts
import { notificationsForEvent, shouldDeliver } from './notifications';

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
    const night = { ...base, now: '2026-03-14T03:00:00.000Z' };
    expect(shouldDeliver({ ...night, notification: n({ priority: 'low' }) })).toBe(true);
    expect(shouldDeliver({ ...night, notification: n({ priority: 'normal' }) })).toBe(false);
    expect(shouldDeliver({ ...night, notification: n({ priority: 'urgent' }) })).toBe(false);
  });
});
```

`src/lib/notificationBus.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { emitGameEvent, onGameEvent } from './notificationBus';

describe('notificationBus', () => {
  it('delivers to subscribers and stops after unsubscribe', () => {
    const spy = vi.fn();
    const off = onGameEvent(spy);
    emitGameEvent({ type: 'bank.deposit', at: 'x', amount: 1, large: false, flagged: true });
    expect(spy).toHaveBeenCalledTimes(1);
    off();
    emitGameEvent({ type: 'bank.deposit', at: 'x', amount: 1, large: false, flagged: true });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/game/notifications.test.ts src/lib/notificationBus.test.ts`
Expected: FAIL — missing exports.

- [ ] **Step 3: Implement** `notificationsForEvent`, `shouldDeliver`, `eventGroupKey` in `src/game/notifications.ts` and the bus in `src/lib/notificationBus.ts`

`notificationsForEvent`:
- bank: `flagged ? [one] : []`; `priority = large ? 'high' : 'normal'`; title `초콜렛뱅크`; body large `고액 입금이 감지되었습니다.` else `짧은 시간에 입금이 반복되었습니다.`; `groupKey 'bank.deposit'`; `expiresAt = at + 24h`; `action {type:'openApp', appId:'bank'}`.
- messenger: one; `priority 'normal'`; `appId = channel === 'telegraph' ? 'telegraph' : 'messagesCall'`; title `새 메시지`; body `${npcName} 님의 메시지가 도착했습니다.`; `groupKey 'msg-' + npcId`; `expiresAt = at + 2h`; action openApp same appId.
- shipment: one; `appId 'delivery'`; title/body by status (수령 대기 / 분실 / 압수); `priority arrived='normal', lost='high', seized='urgent'`; `groupKey 'shipment'`; `expiresAt = at + 6h`; action openApp 'delivery'.

`id` for each: `'ntf-' + event.type + '-' + <event id or at>` (stable, deterministic for tests). Use `nanoid` only if already imported in this file — otherwise deterministic string is fine.

`shouldDeliver`: reject if `n.priority !== 'low'` and the hour of `now` (parsed via `new Date(now).getHours()`, which is UTC — acceptable for the fictional clock) ∈ [0,6); reject if `lastByKey[groupKeyOf(n)]` exists and `now - last < cooldownMinutes` (default 10) minutes; reject if `todayCount >= dailyCap` (default 40). `groupKeyOf(n) = n.groupKey ?? n.appId ?? n.id`.

`notificationBus.ts`: module-level `Set<listener>`; `emitGameEvent` copies the set before iterating; `onGameEvent` returns a remover.

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/game/notifications.test.ts src/lib/notificationBus.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/notifications.ts src/game/notifications.test.ts src/lib/notificationBus.ts src/lib/notificationBus.test.ts
git commit -m "feat(notify): event bus and trigger builders"
```

---

### Task 3: 스토어 — notify·읽음·삭제·v12 마이그레이션

**Files:**
- Modify: `src/store/osStore.ts`
- Test: `src/store/osStore.test.ts` (extend)

**Interfaces:**
- Consumes: Task 2 `GameEvent`, `shouldDeliver`, `notificationsForEvent`, `eventGroupKey`; Task 1 `badgeCounts`.
- Produces (on `OSState`):
  - `notifications: GameNotification[]` (이제 **저장됨**)
  - `notificationMeta: { day: number; todayCount: number; lastByKey: Record<string, string> }`
  - `pillId: string | null`, `pillSeq: number` (비저장)
  - `notify(event: GameEvent): GameNotification[]`
  - `markNotificationRead(id: string): void`
  - `markAllNotificationsRead(): void`
  - `removeNotification(id: string): void`
  - `pushNotification(n: GameNotification): GameNotification | null` (기존 시그니처 유지)

- [ ] **Step 1: Write failing tests** (`src/store/osStore.test.ts`, append)

```ts
import { GAME_EPOCH, useGameStore } from './gameStore';
import { DEFAULT_LAYOUT } from './defaults';
import { useOSStore, migrateOS } from './osStore';
import { useTutorialStore } from './tutorialStore';

beforeEach(() => {
  useOSStore.setState({ notifications: [], notificationMeta: { day: 1, todayCount: 0, lastByKey: {} }, pillId: null, pillSeq: 0 });
  useGameStore.setState({ gameDateTime: GAME_EPOCH, day: 1 });
});

describe('osStore.notify', () => {
  it('stores a delivered notification and returns it', () => {
    const out = useOSStore.getState().notify({ type: 'bank.deposit', at: GAME_EPOCH, amount: 2_000_000, large: true, flagged: true });
    expect(out).toHaveLength(1);
    expect(useOSStore.getState().notifications[0].priority).toBe('high');
  });

  it('applies the cooldown to repeats in the same group', () => {
    const ev = { type: 'shipment.landed' as const, at: GAME_EPOCH, shipmentId: 's1', status: 'arrived' as const, productName: '젤리', qty: 1 };
    expect(useOSStore.getState().notify(ev)).toHaveLength(1);
    expect(useOSStore.getState().notify({ ...ev, shipmentId: 's2' })).toHaveLength(0);
  });

  it('honours the notification consent switch', () => {
    useTutorialStore.setState({ notifications: false });
    expect(useOSStore.getState().notify({ type: 'messenger.arrival', at: GAME_EPOCH, npcId: 'npc-dal', npcName: '달', channel: 'telegraph' })).toHaveLength(0);
    useTutorialStore.setState({ notifications: true });
  });

  it('marks read and removes', () => {
    const [a] = useOSStore.getState().notify({ type: 'bank.deposit', at: GAME_EPOCH, amount: 2_000_000, large: true, flagged: true });
    useOSStore.getState().markNotificationRead(a.id);
    expect(useOSStore.getState().notifications[0].read).toBe(true);
    useOSStore.getState().removeNotification(a.id);
    expect(useOSStore.getState().notifications).toHaveLength(0);
  });
});

describe('osStore migration', () => {
  it('adds notifications + meta to a v11 save', () => {
    const migrated = migrateOS({ theme: 'dark', layout: DEFAULT_LAYOUT } as never, 11);
    expect(migrated.notifications).toEqual([]);
    expect(migrated.notificationMeta).toEqual({ day: 1, todayCount: 0, lastByKey: {} });
  });
});
```

Use `import { DEFAULT_LAYOUT } from './defaults'` and export the migrate function (see Step 3) as `migrateOS` — or assert via `useOSStore.persist`. Simplest: export the migrate callback.

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/store/osStore.test.ts`
Expected: FAIL — `notify` is not a function / `migrateOS` missing.

- [ ] **Step 3: Implement** in `src/store/osStore.ts`

- Import `notificationsForEvent`, `shouldDeliver`, `eventGroupKey` from `@/game/notifications`; `useGameStore` from `./gameStore`; type `GameEvent`.
- State defaults: `notifications: []`, `notificationMeta: { day: 1, todayCount: 0, lastByKey: {} }`, `pillId: null`, `pillSeq: 0`.
- `notify(event)`: read `{ gameDateTime: now, day }` from `useGameStore.getState()`; `built = notificationsForEvent(event)`; `delivered: GameNotification[] = []`; inside `set((s) => { if (s.notificationMeta.day !== day) { s.notificationMeta.day = day; s.notificationMeta.todayCount = 0 } ; if (!useTutorialStore.getState().notifications) return; for (const notif of built) { if (!shouldDeliver({ notification: notif, existing: s.notifications, now, lastByKey: s.notificationMeta.lastByKey, todayCount: s.notificationMeta.todayCount })) continue; s.notifications = [notif, ...s.notifications].slice(0, 20); s.notificationMeta.todayCount += 1; s.notificationMeta.lastByKey[eventGroupKey(event)] = now; delivered.push(notif); if (notif.priority === 'high' || notif.priority === 'urgent') { s.pillId = notif.id; s.pillSeq += 1; } } })`; return `delivered`.
- `markNotificationRead`, `markAllNotificationsRead`, `removeNotification`: straightforward immer mutations.
- `pushNotification(n)`: keep the consent gate; normalize missing fields (`priority ?? 'normal'`, `createdAt ?? useGameStore.getState().gameDateTime`, `read ?? false`); push with the same cap; return the stored one or null.
- `clearNotifications`: also clear `pillId`.
- `partialize`: add `notifications: state.notifications`, `notificationMeta: state.notificationMeta`.
- Export `const migrateOS = (persisted, version) => { ... }` used by `persist({ migrate: migrateOS })`; bump `OS_PERSIST_VERSION` to **12** in `src/store/defaults.ts`; in `migrateOS`, before the `version < 11` branch, nothing — after all existing branches add: `return { ...previous, notifications: previous.notifications ?? [], notificationMeta: previous.notificationMeta ?? { day: 1, todayCount: 0, lastByKey: {} } } as PersistedOS;` and include the same defaults for the `version < 11` early-return path (so v11 and older both get them).

- [ ] **Step 4: Run to verify pass, then full typecheck**

Run: `npx vitest run src/store/osStore.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store/osStore.ts src/store/osStore.test.ts src/store/defaults.ts
git commit -m "feat(notify): store notify/read/remove and os schema v12"
```

---

### Task 4: 브리지 + 게임 스토어 emit + BankApp 정리

**Files:**
- Create: `src/hooks/useNotificationBridge.ts`
- Modify: `src/App.tsx`
- Modify: `src/store/gameStore.ts` (`bankDeposit`, `tickMessenger`, `tickShipments`)
- Modify: `src/apps/bank/BankApp.tsx`
- Test: `src/store/gameStore.test.ts` (extend)

**Interfaces:**
- Consumes: Task 2 `emitGameEvent`, `GameEvent`; Task 3 `notify`; Task 1 `channelsFor`; `haptic` (`@/utils/haptics`), `sound` (`@/lib/sound`).

- [ ] **Step 1: Write failing test** (`src/store/gameStore.test.ts`, append)

```ts
import { onGameEvent } from '@/lib/notificationBus';

it('emits bank.deposit when a deposit is flagged', () => {
  const seen: string[] = [];
  const off = onGameEvent((e) => seen.push(e.type));
  useGameStore.setState({ cash: 1_500_000, bank: { balance: 0, transactions: [] }, gameDateTime: GAME_EPOCH, status: 'playing' });
  useGameStore.getState().bankDeposit(1_200_000);
  off();
  expect(seen).toContain('bank.deposit');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/store/gameStore.test.ts -t emits`
Expected: FAIL — `seen` empty.

- [ ] **Step 3: Implement emits**

- `bankDeposit`: after `set(...)`, `if (result.ok && result.flagged) emitGameEvent({ type: 'bank.deposit', at: <the at used>, amount, large: amount >= LARGE_DEPOSIT, flagged: true })` — capture the timestamp in a local before `set` (`const at = useGameStore.getState().gameDateTime`).
- `tickMessenger`: capture `arrival` via a `let arrived: InboxMessage | null = null` closure; after `set`, if set: `emitGameEvent({ type: 'messenger.arrival', at: arrived.arrivedAt, npcId: arrived.npcId, npcName: npcs.find(x => x.id === arrived!.npcId)?.name ?? '알 수 없음', channel: arrived.channel })`.
- `tickShipments`: capture `landed` (already available) — declare `let landedOut: Shipment[] = []` outside `set`, assign inside; after `set`, for each `s` in `landedOut` with `status` in `arrived|seized|lost`: `emitGameEvent({ type: 'shipment.landed', at: s.etaAt, shipmentId: s.id, status: s.status, productName: s.productName, qty: s.qty })`.
- Import `emitGameEvent` from `@/lib/notificationBus` and `LARGE_DEPOSIT` from `@/content/economy`.

`src/hooks/useNotificationBridge.ts`:

```ts
import { useEffect } from 'react';
import { onGameEvent } from '@/lib/notificationBus';
import { channelsFor } from '@/game/notifications';
import { sound } from '@/lib/sound';
import { haptic } from '@/utils/haptics';
import { useOSStore } from '@/store/osStore';

export function useNotificationBridge(): void {
  useEffect(() => onGameEvent((event) => {
    const delivered = useOSStore.getState().notify(event);
    for (const item of delivered) {
      const ch = channelsFor(item.priority);
      if (ch.haptic) haptic(12);
      if (ch.sound) sound.play('notify');
    }
  }), []);
}
```

`src/App.tsx`: call `useNotificationBridge();` next to `useResolvedTheme();`.

`src/apps/bank/BankApp.tsx`: delete the `pushNotification` selector and its call (keep the inline alert).

- [ ] **Step 4: Run to verify pass + typecheck**

Run: `npx vitest run src/store/gameStore.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useNotificationBridge.ts src/App.tsx src/store/gameStore.ts src/apps/bank/BankApp.tsx src/store/gameStore.test.ts
git commit -m "feat(notify): bridge events into notifications, wire three triggers"
```

---

### Task 5: 알림센터 개편 (그룹·읽음·스와이프 삭제·딥링크)

**Files:**
- Modify: `src/os/NotificationCenter.tsx`
- Test: `src/os/notificationCenter.test.tsx` (create)

**Interfaces:**
- Consumes: Task 1 `visibleNotifications`, `groupNotifications`; Task 3 `notifications`, `markNotificationRead`, `removeNotification`, `clearNotifications`; `getApp`; `useGameStore.gameDateTime`.

- [ ] **Step 1: Write failing test** (`src/os/notificationCenter.test.tsx`)

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { GAME_EPOCH, useGameStore } from '@/store/gameStore';
import { useOSStore } from '@/store/osStore';
import { NotificationCenter } from './NotificationCenter';

beforeEach(() => {
  useGameStore.setState({ gameDateTime: GAME_EPOCH, day: 1 });
  useOSStore.setState({
    overlay: 'notification',
    notifications: [
      { id: 'a', appId: 'bank', priority: 'high', title: '초콜렛뱅크', body: '고액 입금', createdAt: GAME_EPOCH, read: false, action: { type: 'openApp', appId: 'bank' } },
      { id: 'b', appId: 'delivery', priority: 'normal', title: '구팡', body: '수령 대기', createdAt: GAME_EPOCH, read: false },
    ],
  });
});

describe('NotificationCenter', () => {
  it('lists notifications and marks one read on tap', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);
    await user.click(screen.getByText('초콜렛뱅크'));
    expect(useOSStore.getState().notifications.find((n) => n.id === 'a')?.read).toBe(true);
  });

  it('deletes one', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);
    await user.click(screen.getByRole('button', { name: '초콜렛뱅크 삭제' }));
    expect(useOSStore.getState().notifications.map((n) => n.id)).toEqual(['b']);
  });

  it('marks read on tap even when there is no app/action (no crash)', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);
    await user.click(screen.getByText('구팡'));
    expect(useOSStore.getState().notifications.find((n) => n.id === 'b')?.read).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/os/notificationCenter.test.tsx`
Expected: FAIL — delete button not found.

- [ ] **Step 3: Implement** the centre

Render `groupNotifications(visibleNotifications(list, now))`. Each group: latest card (icon initial, title, body, unread dot when `unread>0`, count badge when `items.length>1`). Tap card → **always** `markNotificationRead(latest.id)`; **then, only if** `latest.action` → `getApp(action.appId)?.preload?.(); openApp(action.appId); setOverlay('none')`. Add a per-card swipe-left delete using `useDrag` (movement.x < -60 → `removeNotification`) and an accessible `aria-label={`${title} 삭제`}` delete button on each card (keeps it testable without gestures). Keep the existing "모두 지우기" button and background-tap dismiss.

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/os/notificationCenter.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/os/NotificationCenter.tsx src/os/notificationCenter.test.tsx
git commit -m "feat(notify): group, read and swipe-delete in the notification centre"
```

---

### Task 6: 잠금화면 그룹 미리보기 + 홈 아이콘 배지

**Files:**
- Modify: `src/os/LockScreen.tsx`
- Modify: `src/os/AppIcon.tsx`
- Test: `src/os/appIconBadge.test.tsx` (create)

**Interfaces:**
- Consumes: Task 1 `groupNotifications`, `badgeCounts`; Task 3 `notifications`.

- [ ] **Step 1: Write failing test** (`src/os/appIconBadge.test.tsx`)

```tsx
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { getApp } from '@/apps/registry';
import { useOSStore } from '@/store/osStore';
import { AppIcon } from './AppIcon';

beforeEach(() => {
  useOSStore.setState({ notifications: [
    { id: 'a', appId: 'bank', priority: 'normal', title: 't', body: 'b', createdAt: 'x', read: false },
    { id: 'b', appId: 'bank', priority: 'normal', title: 't', body: 'b', createdAt: 'x', read: false },
  ] });
});

describe('AppIcon badge', () => {
  it('shows the unread count for its app', () => {
    render(<AppIcon app={getApp('bank')!} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/os/appIconBadge.test.tsx`
Expected: FAIL — no `2` node.

- [ ] **Step 3: Implement**

- `AppIcon`: `const badge = useOSStore((s) => badgeCounts(s.notifications)[app.id] ?? 0);` render a red pill (top-right, `ring` to pop over the tile) when `badge > 0`, showing `badge > 9 ? '9+' : badge`, `aria-label={`${app.name} 알림 ${badge}`}`.
- `LockScreen`: replace `.slice(0,4)` with `groupNotifications(notifications).slice(0,4)`; render `group.latest` (bold when `group.unread>0`), a `+N` when `group.items.length>1`; tap → `markNotificationRead(latest.id)` then existing unlock+openApp path (fall back to just unlock when no `appId`).

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/os/appIconBadge.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/os/AppIcon.tsx src/os/LockScreen.tsx src/os/appIconBadge.test.tsx
git commit -m "feat(notify): lock-screen groups and home-icon badges"
```

---

### Task 7: 다이나믹 아일랜드 pill

**Files:**
- Modify: `src/os/DynamicIsland.tsx`
- Modify: `src/os/StatusBar.tsx`
- Test: `src/os/notificationPill.test.tsx` (create)

**Interfaces:**
- Consumes: Task 1 `pillNotification`; Task 3 `notifications`, `pillId`, `overlay`; `useGameStore.gameDateTime`.

- [ ] **Step 1: Write failing test** (`src/os/notificationPill.test.tsx`)

```tsx
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { GAME_EPOCH, useGameStore } from '@/store/gameStore';
import { useOSStore } from '@/store/osStore';
import { StatusBar } from './StatusBar';

beforeEach(() => {
  useGameStore.setState({ gameDateTime: GAME_EPOCH });
  useOSStore.setState({
    overlay: 'none',
    pillId: 'p1', pillSeq: 1,
    notifications: [{ id: 'p1', appId: 'delivery', priority: 'urgent', title: '압수', body: '물량을 잃었습니다', createdAt: GAME_EPOCH, read: false }],
  });
});

describe('notification pill', () => {
  it('shows the active high/urgent item', () => {
    render(<StatusBar />);
    expect(screen.getByText('압수')).toBeInTheDocument();
  });
  it('hides while an overlay is open', () => {
    useOSStore.setState({ overlay: 'notification' });
    render(<StatusBar />);
    expect(screen.queryByText('압수')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/os/notificationPill.test.tsx`
Expected: FAIL — `압수` not found.

- [ ] **Step 3: Implement**

- `DynamicIsland`: accept `pill?: { title: string; appId?: string }` and `onPillTap?: () => void`. When `pill` present, render an expanded capsule (island width grows to fit an icon + truncated title) with `AnimatePresence`; else the current plain capsule.
- `StatusBar`: compute the active item = `pillNotification(notifications, now)` **and** only when `overlay === 'none'` and its `id === pillId`. Pass it as `pill`; `onPillTap` → preload+openApp of `action.appId` and `setOverlay('none')`. The transient (~4s) visibility is driven by `pillId`/`pillSeq`; use a `useEffect` keyed on `pillSeq` that clears the local "visible" flag after ~4000ms.

- [ ] **Step 4: Run to verify pass + full suite + build**

Run: `npx vitest run src/os/notificationPill.test.tsx && npm run typecheck && npm test && npm run build`
Expected: all PASS / build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/os/DynamicIsland.tsx src/os/StatusBar.tsx src/os/notificationPill.test.tsx
git commit -m "feat(notify): dynamic-island pill for high/urgent"
```

---

### Task 8: 문서 + 마무리

**Files:**
- Modify: `phase.md` (Phase 7 체크 + 변경 이력)
- Modify: `README.md` (구현 범위에 알림 한 줄)

- [ ] **Step 1:** `phase.md` §11 의 `[ ] Phase 7` 을 `[x]` 로, 이번 슬라이스 내용(스키마 v12, 트리거 3종, 남은 트리거·배너·사운드는 다음) 기록. §14 변경 이력에 날짜 행 추가. §8.1 "현재 상태(문제)" 를 "해결됨" 으로 갱신.
- [ ] **Step 2:** README "현재 구현 범위" 의 폰 OS 항목에 "알림(우선순위·그룹·배지·pill)" 추가.
- [ ] **Step 3:** Run `npm run typecheck && npm test && npm run build`; 스크린샷이 필요하면 `docs/ui-audit/phase7-*.png` 로 남긴다(선택).
- [ ] **Step 4: Commit**

```bash
git add phase.md README.md
git commit -m "docs(phase7): mark the notification slice done"
```
