# Phase 7 — 알림 시스템 (디자인 문서)

작성: 2026-11-07 · 범위: **B (세로 슬라이스 먼저)** · 상태: 승인 대기

## 1. 의도 (왜)

`phase.md` §8.1 그대로, 지금 알림은 죽어 있습니다. 부팅 시 시드 2개가 전부고 실제
push는 은행 1곳뿐이며, 배지·사운드·진동·딥링크·우선순위·그룹핑이 없습니다. 폰 OS
시뮬레이션에서 알림은 "세계가 나를 기다리고 있다"는 감각을 만드는 핵심 장치입니다.
이 Phase는 그 장치를 실제로 작동하게 만들어, 시간에 쫓기는 거래 루프에 압박을 더합니다.

## 2. 목표 / 비목표 / 안티골

**목표**
- 게임 사건을 **이벤트 버스**로 흘려보내고, 구독자가 알림·배지·(훗날)사운드·로그로 번역한다.
- 알림 **모델**(우선순위·딥링크·읽음·그룹키·만료) + **스팸 규칙**(쿨다운·일일 상한·야간).
- 표현: **알림센터** 개편(그룹·읽음·스와이프 삭제·딥링크), **잠금화면** 그룹 미리보기,
  **홈 아이콘 배지**, **다이나믹 아일랜드 pill**.
- 트리거 3종: **은행(큰 입금)**, **메신저(새 메시지)**, **배송(도착/압수/분실)**.

**비목표 (이번 범위 밖, 다음 패스)**
- 나머지 트리거(초선일보·순찰·거래 마감·러너·steak·브라우저 재입고/차단·약속 5분 전).
- 인앱 배너. 사운드(Phase 8). 서비스워커 푸시. 앱 내 특정 화면(targetId) 딥링크.

**안티골 (실패 조건)**
- 알림이 **상태를 바꾸면 안 된다**(§8.5). 놓쳐도 손해가 없어야 한다.
- 스팸이 되어 알림이 무시당하면 안 된다.
- 기존 세이브를 깨면 안 된다.

## 3. 제약

- `src/game/*` 는 **순수**(React·store import 금지) — 알림 규칙도 순수 함수로.
- 콘텐츠/문구는 editability 원칙(§6)을 따르되, 이번엔 문구 템플릿을 `content/` 로 빼지 않고
  트리거 빌더에 둔다(다음 패스에서 `content/notifications.ts` 로 이관 가능).
- 사운드는 Phase 8까지 no-op 스텁.
- 매 Phase 검증: `typecheck → test → build`.

## 4. 접근 (택1)

- **A) 한 번에 전부** — 버스+모델+트리거 9종+표현 5종+스팸. 큰 작업, 리뷰·검증 부담 큼.
- **B) 세로 슬라이스 먼저 (선택)** — 모델+버스+알림센터 개편+배지+pill + 트리거 3종.
  검증 후 나머지 트리거·배너로 확장. **사용자 선택.**
- **C) 대기** — 셸 복구까지 설계만.

B를 고른 이유: 시스템의 **모든 층(모델·버스·저장·표현·트리거)** 을 한 번 관통해 검증하면,
나머지 트리거는 같은 배관에 값을 더하는 일이 되어 리스크가 급감한다. A는 한 번에 너무 넓고,
C는 진전이 없다.

## 5. 설계

### 5.1 모델 (`src/types/index.ts`)

```ts
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationAction = {
  type: 'openApp';
  appId: string;
  /** 예약: 훗날 특정 탭/화면. 이번엔 사용 안 함. */
  targetId?: string;
};

export interface GameNotification {
  id: string;
  appId?: string;
  priority: NotificationPriority;
  title: string;
  body: string;
  action?: NotificationAction;
  /** 게임 시간 ISO. 생성 시각. */
  createdAt: string;
  read: boolean;
  groupKey?: string;
  /** 게임 시간 ISO. 지나면 센터에서 사라진다(로그 표시용). */
  expiresAt?: string;
}
```

기존 `date` 필드는 `createdAt` 로 대체한다. 생성 지점은 시드 2개 + 은행 1곳뿐이라
호출부 수정은 국소적이다.

### 5.2 순수 로직 (`src/game/notifications.ts`)

React·store 없이 테스트 가능한 규칙.

```ts
export interface NotificationChannels {
  center: boolean; banner: boolean; pill: boolean; sound: boolean; haptic: boolean;
}
/**
 * §8.5 우선순위별 표현. `center` 는 **항상 true**(센터는 로그): 알림은 어떤
 * 우선순위든 센터에 남고, banner/pill/sound/haptic 이 *추가* 표현이다.
 * sound 는 지금 no-op(Phase 8). banner 는 이번 패스 미구현.
 */
export function channelsFor(priority: NotificationPriority): NotificationChannels;

/** §8.5 스팸 가드. 통과하면 true. */
export function shouldDeliver(input: {
  notification: GameNotification;
  existing: readonly GameNotification[];
  /** 게임 시각 ISO (now). */
  now: string;
  /** groupKey/title 별 마지막 생성 시각. */
  lastByKey: Readonly<Record<string, string>>;
  /** 오늘(게임 일자) 생성 수. */
  todayCount: number;
  cooldownMinutes?: number; // 기본 10
  dailyCap?: number;        // 기본 40
}): boolean;

export function isExpired(n: GameNotification, now: string): boolean;

/** 만료 제거 + (우선순위 desc, 시각 desc) 정렬. */
export function visibleNotifications(
  list: readonly GameNotification[], now: string,
): GameNotification[];

/** 같은 groupKey(없으면 appId)끼리 묶어 그룹 목록. */
export interface NotificationGroup {
  key: string; appId?: string;
  latest: GameNotification;
  items: GameNotification[];
  unread: number;
}
export function groupNotifications(
  list: readonly GameNotification[],
): NotificationGroup[];

/** 앱별 안 읽은 개수 → 홈 아이콘 배지. */
export function badgeCounts(list: readonly GameNotification[]): Record<string, number>;

/** 다이나믹 아일랜드에 띄울 것: 만료 안 된 high/urgent 중 가장 최근. */
export function pillNotification(
  list: readonly GameNotification[], now: string,
): GameNotification | null;
```

### 5.3 이벤트 버스 (`src/lib/notificationBus.ts`)

게임 로직은 이벤트만 던지고, 구독자가 번역한다(§8.2).

```ts
export type GameEvent =
  | { type: 'bank.deposit'; at: string; amount: number; large: boolean }
  | { type: 'messenger.arrival'; at: string; npcId: string; channel: 'telegraph' | 'phone' }
  | { type: 'shipment.landed'; at: string; shipmentId: string; status: 'arrived' | 'seized' | 'lost';
      productName: string; qty: number };

export type GameEventListener = (event: GameEvent) => void;
export function onGameEvent(listener: GameEventListener): () => void;
export function emitGameEvent(event: GameEvent): void;
```

순수 빌더가 이벤트 → 0개 이상의 `GameNotification` 으로 바꾼다. 빌더는
`src/game/notifications.ts` 의 `notificationsForEvent(event)` 로 둔다(트리거 3종 포함).

### 5.4 스토어 (`src/store/osStore.ts`) — `phone-os:os` v11 → **v12**

- `notifications: GameNotification[]` (기존) — 이제 **저장**한다(cap 20).
- `notificationMeta: { day: number; todayCount: number; lastByKey: Record<string,string> }` — 스팸 상태(저장).
- 새 액션:
  - `notify(event: GameEvent): GameNotification[]` — 빌더 호출 → `shouldDeliver` 로 거른 뒤 push + meta
    갱신, **실제로 전달된 알림 목록을 반환**(브리지가 채널에 따라 haptic/sound 를 건다).
  - `markNotificationRead(id)`, `markAllNotificationsRead()`, `removeNotification(id)`, `clearNotifications()`(기존).
  - `pushNotification(n)` (기존) — 하위 호환: 모델 기본값을 채워 같은 경로로 넣고, 그 알림을 반환.
- `partialize` 에 `notifications`·`notificationMeta` 추가. `migrate`:
  `notifications: previous.notifications ?? []`, `notificationMeta: previous.notificationMeta ?? {...}`.
- `notifications` 동의(`tutorialStore.notifications`) 게이트는 유지(§7 구현과 일치).

### 5.5 배선 (`src/hooks/useNotificationBridge.ts` + `App.tsx`)

`onGameEvent` 를 구독해 `notify(event)` 로 넘기고, 전달된 알림의 채널에 따라
`haptic()`(있음) / `sound.play('notify')`(Phase 8까지 no-op) 를 호출한다. `App` 에서 1회.

emit 지점(스토어 액션, 이미 결과를 만들던 자리):
- `bankDeposit` → `bank.deposit` (large = §2.3 대형 입금 기준).
- `tickMessenger` 새 도착 → `messenger.arrival`.
- `advanceShipments`/수령 처리에서 landed 이벤트 → `shipment.landed`.

### 5.6 표현 (UI)

- **알림센터** (`src/os/NotificationCenter.tsx`): 그룹 카드(최신 + 개수), 안 읽음 점,
  그룹 펼치기, **왼쪽 스와이프로 개별 삭제**(useDrag, 기존 제스처 스타일), "모두 지우기",
  카드 탭 → `action` 딥링크(`openApp` + `preload`).
- **잠금화면** (`src/os/LockScreen.tsx`): 그룹화된 상위 N개 미리보기(현재 4 → 그룹 기준).
  탭 시 기존처럼 unlock + openApp(딥링크 경로로 통일).
- **홈 아이콘 배지** (`src/os/AppIcon.tsx`): `badgeCounts` 를 구독해 앱별 안 읽은 수 표시.
- **다이나믹 아일랜드 pill** (`src/os/DynamicIsland.tsx` + `OSShell`): 새 high/urgent 가 오면
  잠시(약 4초) 캡슐이 늘어나 아이콘+제목을 보여주고, 탭하면 딥링크. 그 외엔 기존 정적 캡슐.

### 5.7 스팸 규칙 (§8.5)

- 그룹별 쿨다운 **기본 10분**(게임 시간).
- 하루(게임 일자) 상한 **40**.
- 야간(게임 00~06시)에는 `low` 만.
- 알림은 상태를 바꾸지 않으며, 놓쳐도 손해 없음(센터에 로그로 남음).

### 5.8 빌더 확인에서 정한 것 (작성자 결정 — 검토 요청)

빌더 리뷰가 남긴 7개 질문을 다음처럼 정했다. 표시된 것은 모두 **내 결정**이며, 승인 시 확정된다.

1. **전달의 주인** — `notify(event)` 가 **전달된 `GameNotification[]` 를 반환**한다. 브리지
   (`useNotificationBridge`)가 그 반환값의 `channelsFor(priority)` 로 `haptic`/`sound` 를 건다.
   `pushNotification`(현 유일 호출자 `BankApp`)은 같은 저장 경로로 위임하고 그 알림을 반환한다.
2. **은행 트리거** — `gameStore.bankDeposit` 이 `bank.deposit` 를 emit 한다(`large = amount >= LARGE_DEPOSIT`).
   기존과 동일하게 **flagged(large 또는 빈번)일 때만** 알림. 우선순위는 `large ? 'high' : 'normal'`.
   `BankApp` 의 `pushNotification` 호출은 **제거**(버스가 처리), 인앱 인라인 알림은 유지.
3. **`center` 의미** — 위 §5.2 대로 **모든 우선순위에서 true**(센터=로그). banner/pill/sound/haptic 이 추가 표현.
   우선순위→표현: `low`=센터만 / `normal`=+banner / `high`=+banner+pill+haptic / `urgent`=+banner+pill+haptic+sound.
4. **now·day 출처** — `notify` 가 `useGameStore.getState()` 에서 `gameDateTime`(now)과 `day` 를 읽는다
   (osStore→gameStore 단방향 import, 순환 없음). `day !== notificationMeta.day` 면 `todayCount` 리셋(lazy).
5. **트리거 우선순위** — `bank.deposit`(large='high' / flagged='normal'), `messenger.arrival`='normal',
   `shipment.landed`(arrived='normal' / lost='high' / seized='urgent').
6. **pill 위치** — `StatusBar` 안에 있어 잠금화면·홈·앱 위에 뜬다. 단 **overlay(알림/컨트롤센터·전환기)가
   열려 있으면 숨긴다**(중첩 방지). 새 high/urgent 는 스토어의 `pillSeq`/`pillId` 로 감지해 약 4초 노출.
7. **만료** — 트리거 빌더가 `expiresAt` 을 채운다(messenger=게임 2시간, shipment=6시간, bank=24시간).
   만료 로직이 이번 패스에 실제로 동작한다.

## 6. 테스트

- **순수** `src/game/notifications.test.ts`: `channelsFor`, `shouldDeliver`(쿨다운/상한/야간),
  `visibleNotifications`(만료·정렬), `groupNotifications`, `badgeCounts`, `pillNotification`,
  `notificationsForEvent`(3종).
- **스토어** (`osStore.test.ts` 확장 또는 신규): `notify` 가 스팸 규칙 적용, 읽음/삭제/전체읽음,
  `notificationMeta` 갱신, v12 마이그레이션이 기존 세이브에 안전.
- **컴포넌트**: 알림센터(그룹 표시·탭 딥링크·스와이프 삭제), 아이콘 배지, pill.
- 회귀: 기존 289 테스트 유지.

## 7. 마이그레이션 / 호환

- `OS_PERSIST_VERSION` **11 → 12**. 구세이브: `notifications` 없음 → `[]`, `notificationMeta` 기본값.
- `pushNotification` 시그니처 유지(하위 호환)하되 모델 필드는 기본값으로 채운다.
- `GameNotification.date` → `createdAt` 리네임(시드/은행 3곳 수정).

## 8. 빌더에게 남기는 것

- pill 노출 시간(약 4초)과 애니메이션 세부.
- 그룹 카드의 정확한 레이아웃/색(기존 `glass-strong` 표면 재사용).
- 문구 톤(기존 한국어 UI와 일치).
- 다음 패스에서 다룰 나머지 트리거·인앱 배너·`content/notifications.ts` 이관.
