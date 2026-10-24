# Phone OS Trade Sim (가제)

가짜 iOS 스타일의 **폰 OS를 조작하는 모바일 우선 웹 트레이딩 시뮬레이션**입니다. 길거리 소규모 거래에서 시작해 게임 속 가짜 암시장을 키워 나가고, 사이트·고객·단서의 진위를 판단하는 압박을 다룹니다. 허니팟 메커니즘을 포함합니다.

> 이 게임은 **전부 허구**이며, 게임 내부의 가짜 시스템만 다룹니다. 실제 방법·실제 서비스·실존 인물을 재현하지 않습니다. Apple 및 기타 상표/에셋은 사용하지 않고, 모양만 비슷하게 직접 그렸습니다.

## 현재 구현 범위

이번 마일스톤은 **게임 로직이 아니라 "뼈대 + iOS 스타일 폰 OS + 앱 열고 닫기"**까지입니다.

- iPhone 비율 프레임(데스크톱) / 전체 화면(모바일, `100dvh` + safe-area)
- 상태바(게임 내 시계, 신호·와이파이·배터리), 다이나믹 아일랜드, 홈 인디케이터
- 잠금 화면(큰 시계·날짜, 알림 카드, 손전등/카메라 버튼, 스와이프 업 해제)
- 홈 화면: 위젯 2개, 4열 아이콘 그리드, 페이지 스와이프 + 도트, 블러 독
- 아이콘 편집 모드(지글 애니메이션) + 드래그 정렬, 배치 영구 저장
- 앱 열기/닫기 iOS식 줌 전환(`layoutId` 공유 요소 + 스프링)
- 앱 전환기(최근 앱 카드), 알림센터, 컨트롤센터
- 앱 껍데기 9종: 거래 · 메시지 · 브라우저 · 지갑 · 메모 · 설정 · 메일 · 포럼 · 연락처
- 상태 저장(Zustand + persist + 버전/마이그레이션), Supabase 클라이언트 자리, PWA

게임 로직(가격·고객·heat·이벤트·마켓)은 UI와 분리된 `src/game/` 순수 함수와 `src/data/*.json` 자리로만 준비되어 있습니다.

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
| 사운드 | howler (API만 준비, 오디오 에셋 미포함) |
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
  os/        폰 프레임, 상태바, 다이나믹 아일랜드, 잠금화면, 홈, 독, 위젯,
             알림센터, 컨트롤센터, 앱 전환기, 앱 창, 셸 제스처
  apps/      앱 9종 + registry.ts (앱 등록)
  game/      순수 로직: pricing, heat, customers, events, markets
  data/      markets / npcs / clues JSON 자리
  store/     osStore.ts, gameStore.ts (persist + version/migrate)
  lib/       supabase.ts, saveService.ts, sound.ts
  styles/    tokens.css (CSS 변수), globals.css
  hooks/     useResolvedTheme, useGameClock, useMediaQuery, useNow, useLongPress
  utils/     cn, format, haptics, motion
  types/     공용 타입
```

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
    gradient: ['#a855f7', '#6366f1'],
    Component: MyApp,
  },
};
```

3. 홈 배치에 넣으려면 `src/store/defaults.ts` 의 `DEFAULT_PAGES` / `DEFAULT_DOCK` 에 id를 추가합니다.

홈 화면·독·앱 전환기는 모두 레지스트리를 읽으므로 다른 파일은 수정할 필요가 없습니다.

## 상태 저장

- `osStore` — 열린 앱/최근 앱, 잠금 상태, 테마, 상태바 값, 컨트롤센터 값, 홈 배치, 알림 (`phone-os:os`)
- `gameStore` — 현금, heat, 게임 날짜/시계, 재고 (더미) (`phone-os:game`)
- 두 스토어 모두 `persist` + `version` 필드를 사용해 **마이그레이션 가능**하게 저장합니다. UI 상태(열린 앱 등)는 저장하지 않습니다.
- 설정 앱에서 **세이브 내보내기/불러오기**(JSON)를 지원합니다.

## Supabase (연결은 아직 하지 않음)

- `src/lib/supabase.ts` 가 환경변수에서 URL/anon key를 읽어 클라이언트를 만듭니다. **값이 없으면 `null` 을 반환하고 게임은 오프라인 모드로 완전히 동작합니다.**
- `src/lib/saveService.ts` 에 `load` / `save` / `clear` 인터페이스와 로컬 구현체가 있습니다. 익명 로그인 + 클라우드 세이브는 이 인터페이스 뒤에 붙입니다.
- 🔒 **`service_role` 키는 절대 프론트엔드 코드/저장소에 넣지 마세요.** `.env` 는 `.gitignore` 처리되어 있고 `.env.example` 만 커밋됩니다.

## 라이선스 / 출처

참고한 레포와 "어떤 수치를 참고했는지"는 [`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md) 에 정리했습니다. 코드를 그대로 복사한 곳은 없습니다.

## 면책 문구

이 게임은 전부 허구이며, 게임 내 가짜 시스템만 다룹니다. 실제 불법 행위, 실제 서비스, 실존 인물과는 아무런 관련이 없습니다. 등장하는 마켓·상품·NPC·사건은 모두 시뮬레이션용 창작물입니다.
