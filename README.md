# Phone OS Trade Sim (가제)

가짜 iOS 스타일의 **폰 OS를 조작하는 모바일 우선 웹 트레이딩 시뮬레이션**입니다. 길거리 소규모 거래에서 시작해 게임 속 가짜 암시장을 키워 나가고, 사이트·고객·단서의 진위를 판단하는 압박을 다룹니다. 허니팟 메커니즘을 포함합니다.

> 이 게임은 **전부 허구**이며, 게임 내부의 가짜 시스템만 다룹니다. 실제 방법·실제 서비스·실존 인물을 재현하지 않습니다. Apple 및 기타 상표/에셋은 사용하지 않고, 모양만 비슷하게 직접 그렸습니다.

## 현재 구현 범위

폰 OS 껍데기부터 **거래 하루 루프 전체**까지 구현되어 있습니다. 자세한 진행 상황과 설계는 [`phase.md`](./phase.md) 참고.

- **폰 OS**: iPhone 비율 프레임(데스크톱) / 전체 화면(모바일, `100dvh` + safe-area), 상태바(게임 시계·신호·배터리), 다이나믹 아일랜드, 홈 인디케이터, 잠금 화면, 홈 화면(위젯·4열 그리드·블러 독), 아이콘 편집(지글·드래그 정렬), 앱 열기/닫기 줌 전환, 앱 전환기, 알림센터, 컨트롤센터
- **알림**: 이벤트 버스 기반 — 우선순위·그룹·배지·다이나믹 아일랜드 pill + 트리거 3종(은행 고액/이상 입금 · 메신저 도착 · 배송 도착/분실/압수), 알림센터 그룹·읽음·스와이프 삭제·딥링크
- **앱 20종**: 거래 · 메시지/통화 · Chroma · Sailor · Shade · 지갑 · 메모 · 설정 · Gmall · Protean · Telegraph · Ex · 포럼 · 연락처 · 초콜렛뱅크 · 초선일보 · 구팡 · Maps · Amason · steak
- **거래 하루 루프**: 매입 → 배송 → 수령(주소별 heat·압수·분실) → 메신저 응대 → 약속(예약 판매) → 만남/판매 → 자금 정리(은행·steak) → 하루 마감. 모든 행동이 게임 시간을 소모합니다.
- **게임 시스템**: 품목 11종 + 스페셜 3종, NPC 24명, 채널 2종 메신저, 신뢰, 시세 변동, heat(현금·방문·이동), 보관 용량/압수, 러너(자동 판매), 피싱 메일, 단서로 마켓 판별(허니팟/사기)
- **브라우저 3종 차별화**: 망 계층(`clearnet` / `mirror` / `onion`) — Chroma는 `.onion` 차단, Sailor는 미러까지(+heat), Shade는 발견한 `.onion`(+초대·시간 소모)
- **일상 웹**: 마켓 외에 **ViewTube(영상) · Sleuth(검색) · 중고마을 · OpenPedia(위키) · OpenPedia .onion**. 영상으로 시간 보내기, 위키로 주소 해금, 함정(무료 시청·선입금·검색 광고)
- **Amason**: 영어 전용 미국 쇼핑 앱(달러 + 원화 병기). 거래 루프와 분리된 생활 콘텐츠
- **튜토리얼**: 손글씨 `hello` 인트로 → 초기 설정 → 홈 전용 플레이 가이드(스포트라이트·자동 완료·건너뛰기)
- **상태 저장**: Zustand `persist` + 버전/마이그레이션, 세이브 내보내기/불러오기, PWA(오프라인 캐시 + 홈 화면 설치)

게임 로직은 UI와 분리된 `src/game/` **순수 함수**로, 편집 가능한 콘텐츠는 `src/content/*.ts` 로 모여 있습니다.

## 기술 스택

| 영역 | 사용 |
| --- | --- |
| 프레임워크 | React 18 + Vite 5 + TypeScript (strict) |
| 상태 | Zustand 4 (`persist` + `immer`) |
| 애니메이션 | Framer Motion (spring, `layoutId` 공유 전환) |
| 제스처 | @use-gesture/react (스와이프 업/다운, 페이지 스와이프) |
| 스타일 | Tailwind CSS 3 + CSS 변수 토큰 (`src/styles/tokens.css`) |
| 드래그 정렬 | dnd-kit (core / sortable / utilities / modifiers) |
| 아이콘 | lucide-react, react-icons |
| 날짜 | date-fns (게임 내 가상 날짜) |
| 사운드 | howler (Phase 8 예정 — 아직 에셋·합성 톤 미포함) |
| 유틸 | immer, nanoid, zod, clsx, tailwind-merge |
| 백엔드(예정) | @supabase/supabase-js (클라이언트 초기화만) |
| 품질 | ESLint, Prettier, Vitest + Testing Library |
| PWA | vite-plugin-pwa (오프라인 캐시 + 홈 화면 설치) |

## 로컬 실행 방법

```bash
# 1) 의존성 설치
npm install

# 2) (선택) 환경변수 — 없으면 오프라인 모드로 동작합니다
cp .env.example .env
#   VITE_SUPABASE_URL=...        (public anon URL)
#   VITE_SUPABASE_ANON_KEY=...   (public anon key — service_role 키는 절대 프론트에 넣지 마세요)

# 3) 개발 서버
npm run dev        # http://localhost:5173
```

### 명령어

| 스크립트 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 (`--host`로 같은 네트워크의 폰에서도 접속 가능) |
| `npm run build` | `tsc --noEmit` + 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | ESLint |
| `npm run typecheck` | 타입 검사만 |
| `npm run test` / `test:watch` | Vitest |
| `npm run format` | Prettier |
| `npm run icons` | PWA PNG 아이콘 재생성 (`scripts/generate-icons.mjs`) |

### 폰 크기 화면으로 확인하기

1. `npm run dev` 실행 후 Chrome/Edge에서 접속합니다.
2. `F12` → **기기 툴바(Ctrl+Shift+M)** → **iPhone 14 Pro / 15 Pro** 선택.
3. 주소창의 **모바일 뷰**에서 새로고침하면 safe-area와 `100dvh`가 실제 기기처럼 적용됩니다.
4. 실제 폰에서는 `npm run dev` 출력의 `Network` 주소로 접속하거나, `npm run build && npm run preview` 후 **홈 화면에 추가**(PWA)해서 전체화면으로 실행하세요.
5. 데스크톱 넓은 화면에서는 자동으로 아이폰 베젤 프레임 안에서 게임이 돌아갑니다.

## 조작 (제스처 맵)

| 제스처 | 결과 |
| --- | --- |
| 잠금 화면에서 위로 스와이프 | 잠금 해제 |
| 아이콘 탭 | 앱 열기 (아이콘 위치에서 줌 확대) |
| 아이콘 길게 누르기 | 편집 모드(지글) 진입 → 드래그로 재배치, 우측 상단 **완료** |
| 홈 화면 좌우 스와이프 | 페이지 이동 (도트 표시) |
| 화면 **왼쪽 위** 모서리에서 아래로 | 알림센터 |
| 화면 **오른쪽 위** 모서리에서 아래로 | 컨트롤센터 |
| 화면 **아래**에서 위로 | 앱이 열려 있으면 홈으로, 더 길게 밀면 앱 전환기 |
| 앱 전환기에서 카드 위로 쓸기 | 해당 앱 종료 |

> iOS는 "밀고 멈춤"과 "튕김"을 시간으로 구분하지만, 여기서는 **이동 거리**로 근사했습니다(짧게=홈, 길게=앱 전환기). 이 가정은 `src/os/OSShell.tsx`에 문서화되어 있습니다.

## 폴더 구조

```
src/
  os/         폰 프레임, 상태바, 다이나믹 아일랜드, 잠금화면, 홈, 독, 위젯,
              알림센터, 컨트롤센터, 앱 전환기, 앱 창, 셸 제스처, 온보딩·가이드
  apps/       앱 20종 + registry.ts (앱 등록) + 공용 AppShell/EmptyState
  game/       순수 로직: pricing, heat, exposure, markets, trade, customers,
              events, messenger, deals, shipments, bank, patrol, steak, news,
              tutorial, sites, economy
  content/    편집용 콘텐츠: economy, sites, messages, vendors, logistics,
              forum, phishing, runners, amason, tutorial …
  data/       markets / npcs / clues / products / places (JSON·TS)
  store/      gameStore, osStore, tutorialStore, amasonStore (persist + version/migrate)
  lib/        supabase.ts, saveService.ts, sound.ts
  components/ 공용 UI (Pill 등)
  styles/     tokens.css (CSS 변수), globals.css, fonts.css
  hooks/      useResolvedTheme, useGameClock, useMediaQuery, useNow, useLongPress …
  utils/      cn, format, haptics, motion, color
  assets/     인트로 손글씨 폰트(OFL) 등
  types/      공용 타입
```

## 콘텐츠 편집 (코드 수정 없이)

밸런스 수치와 문구는 `src/content/*.ts` 배열/상수만 고치면 됩니다. 각 파일 상단에 `// 편집 방법:` 주석이 있습니다. 로직은 `src/game/`, 콘텐츠는 `src/content/` 원칙입니다.

| 파일 | 내용 |
| --- | --- |
| `content/economy.ts` | 모든 밸런스 수치(시작 자금, 목표, 지출, heat 기준 등) |
| `content/sites.ts` | 일상 웹 사이트(영상·검색·중고·위키) |
| `content/messages.ts` | 메신저 대사/선택지 |
| `content/vendors.ts` | 공급자·스페셜 품목 |
| `content/logistics.ts` | 수령 주소 3곳과 비용/리스크 |
| `content/phishing.ts` | 피싱 메일 |
| `content/runners.ts` | 러너 |
| `content/amason.ts` | Amason 품목(영어, 달러, 이미지 URL) |
| `content/tutorial.ts` | 인트로 문구·스텝 |

## 새 앱 추가하는 방법

1. `src/apps/<name>/<Name>App.tsx` 를 만들고 컴포넌트를 export 합니다. (보통 `AppShell` + `EmptyState` 사용)
2. `src/apps/registry.ts` 에 항목 한 줄을 추가합니다:

```ts
export const APP_REGISTRY = {
  // ...
  myapp: {
    id: 'myapp',
    name: '내 앱',
    icon: Sparkles,
    accent: '#a855f7',
    gradient: ['#a855f7', '#6366f1'],
    ...lazyApp(() => import('./myapp/MyApp'), 'MyApp'),
  },
};
```

3. 홈 배치에 넣으려면 `src/store/defaults.ts` 의 `DEFAULT_PAGES` / `DEFAULT_DOCK` 에 id를 추가합니다.

홈 화면·독·앱 전환기는 모두 레지스트리를 읽으므로 다른 파일은 수정할 필요가 없습니다. 앱 구현은 `lazyApp()` 으로 청크가 분리되고, 아이콘 press/hover에서 `preload()` 됩니다.

## 상태 저장

- `gameStore` — 현금, heat, 날짜/시계, 재고, 배송, 약속, 은행/steak, 신원, 통계, 학습한 단서 (`phone-os:game`, 스키마 **v10**)
- `osStore` — 열린 앱/최근 앱, 잠금, 테마, 상태바, 컨트롤센터, 홈 배치, 알림 (`phone-os:os`, 스키마 **v11**)
- `tutorialStore` — 인트로/설정/가이드 상태 (게임 세이브와 분리, `phone-os:tutorial`)
- `amasonStore` — Amason 장바구니/주문 (`phone-os:amason`)
- 모두 `persist` + `version` + `migrate` 로 **기존 세이브를 버리지 않고** 이전합니다. UI 상태(열린 앱 등)는 저장하지 않습니다.
- 설정 앱에서 **세이브 내보내기/불러오기**(JSON)를 지원합니다.

## 로드맵

Phase 0–6c + Amason까지 완료입니다. 다음은 **Phase 7(알림 시스템)** → Phase 8(오디오) → Phase 9(DB) → Phase 10(콘텐츠 이관·문서). 상세 계획·수치·변경 이력은 [`phase.md`](./phase.md).

## Supabase (연결은 아직 하지 않음)

- `src/lib/supabase.ts` 가 환경변수에서 URL/anon key를 읽어 클라이언트를 만듭니다. **값이 없으면 `null` 을 반환하고 게임은 오프라인 모드로 완전히 동작합니다.**
- `src/lib/saveService.ts` 에 `load` / `save` / `clear` 인터페이스와 로컬 구현체가 있습니다. 익명 로그인 + 클라우드 세이브는 이 인터페이스 뒤에 붙입니다.
- 🔒 **`service_role` 키는 절대 프론트엔드 코드/저장소에 넣지 마세요.** `.env` 는 `.gitignore` 처리되어 있고 `.env.example` 만 커밋됩니다.

## 라이선스 / 출처

참고한 레포와 "어떤 수치를 참고했는지"는 [`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md) 에 정리했습니다. 코드를 그대로 복사한 곳은 없습니다.

## 면책 문구

이 게임은 전부 허구이며, 게임 내 가짜 시스템만 다룹니다. 실제 불법 행위, 실제 서비스, 실존 인물과는 아무런 관련이 없습니다. 등장하는 마켓·상품·NPC·사건은 모두 시뮬레이션용 창작물입니다.
