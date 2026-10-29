/**
 * 튜토리얼 콘텐츠 — 편집 방법
 *
 * 1) `INTRO_GREETINGS` : 부팅 직후 검은 화면에 하나씩 나타나는 인사말입니다.
 *    - `text`  : 화면에 크게 뜨는 문구
 *    - `lang`  : 아래쪽 작은 언어 표기
 *    - `hold`  : 이 문구가 머무는 시간(ms). 0.9초 ≈ 한 호흡
 *    - 문구/순서/언어를 자유롭게 추가·삭제하면 그대로 반영됩니다.
 * 2) `INTRO_FINAL` : 인사말이 끝난 뒤 마지막으로 남는 문구. `{name}` 은 플레이어 이름.
 * 3) `SETUP_STEPS` : 초기 설정 화면 문구(이름 → 주 신원 → 기기 이름 → 알림/소리).
 * 4) `TUTORIAL_STEPS` : 플레이 가이드. 배열 순서가 곧 진행 순서입니다.
 *    - `appId`     : 안내할 앱. "앱 열기" 버튼이 이 앱을 엽니다.
 *    - `appIdFor`  : 주 신원(실명/별명)에 따라 앱을 다르게 안내할 때 사용(메신저).
 *    - `goal`      : 이 단계가 끝났다고 판단하는 조건
 *        · `{ type: 'openApp' }`  → 해당 앱을 열면 완료
 *        · `{ type: 'stat', metric, target }` → 게임 수치가 target 이상이면 완료
 *    - `title` / `text` : 가이드 카드에 보이는 문구
 *    - 단계를 추가하려면 배열에 객체를 하나 더 넣으면 됩니다(코드 수정 불필요).
 *
 * 숫자(목표)는 모두 허구의 게임 밸런스 값입니다.
 */
import type { IdentityKind } from '@/types';

export type IntroScript = 'latin' | 'korean' | 'japanese' | 'chinese' | 'arabic';

export interface IntroGreeting {
  text: string;
  lang: string;
  /** BCP-47 tag for `lang=`, so the browser shapes the script correctly. */
  langTag: string;
  /** Which hand-lettered face (see `styles/fonts.css`) draws this greeting. */
  script: IntroScript;
  /** 완전히 그려진 뒤 머무는 시간(ms). 전환 시간은 화면이 더합니다. */
  hold: number;
}

export const INTRO_GREETINGS: IntroGreeting[] = [
  { text: 'hello', lang: 'English', langTag: 'en', script: 'latin', hold: 650 },
  { text: '안녕하세요', lang: '한국어', langTag: 'ko', script: 'korean', hold: 650 },
  { text: 'こんにちは', lang: '日本語', langTag: 'ja', script: 'japanese', hold: 650 },
  { text: '你好', lang: '中文', langTag: 'zh-Hans', script: 'chinese', hold: 650 },
  { text: 'hola', lang: 'Español', langTag: 'es', script: 'latin', hold: 650 },
  { text: 'مرحبا', lang: 'العربية', langTag: 'ar', script: 'arabic', hold: 650 },
];

/** 인사말이 끝난 뒤 남는 문구. `{name}` 은 플레이어 이름으로 치환됩니다. */
export const INTRO_FINAL = '안녕, {name}';

/** 초기 설정 단계의 제목/설명. 화면 구성은 같고 문구만 바뀝니다. */
export const SETUP_COPY = {
  name: {
    eyebrow: '이 기기의 주인',
    title: '이름을 알려줘',
    body: '게임 안에서 쓰일 가상의 이름입니다. 은행 예금주와 지갑에 표시됩니다.',
    placeholder: '이지훈',
    cta: '계속',
  },
  identity: {
    eyebrow: '주 신원',
    title: '어떤 이름으로 움직일까?',
    body: '앱마다 실명/별명을 따로 고를 수 있습니다. 여기서는 가이드가 추천할 기본값만 정합니다.',
    cta: '계속',
  },
  device: {
    eyebrow: '기기 이름',
    title: '이 폰의 이름은?',
    body: '설정과 저장 화면에 표시되는 이름입니다.',
    placeholder: '의 iPhone',
    cta: '계속',
  },
  consent: {
    eyebrow: '마지막으로',
    title: '알림과 소리',
    body: '게임 알림과 효과음을 켤지 정합니다. 언제든 설정에서 바꿀 수 있습니다.',
    cta: '시작하기',
  },
} as const;

export const IDENTITY_OPTIONS: {
  value: IdentityKind;
  title: string;
  body: string;
  hint: string;
}[] = [
  {
    value: 'alias',
    title: '별명',
    body: '거래와 익명 활동에 어울립니다. 노출도가 낮습니다.',
    hint: '추천: 첫 거래',
  },
  {
    value: 'realname',
    title: '실명',
    body: '은행·지인 연락처럼 정당한 곳에 어울립니다. 노출도가 높습니다.',
    hint: '정면 승부',
  },
];

/**
 * 주 신원 선택이 실제로 어떤 앱을 추천할지 바꾸는 단계에서 씁니다.
 * 단계가 쓰는 수치만 둡니다: 재고·마켓 주소를 보던 단계(구팡 수령 / 포럼 주소)는 제거됨.
 */
export type TutorialMetric = 'shipments' | 'replies' | 'sales' | 'bankTransactions' | 'day';

export type TutorialGoal =
  | { type: 'openApp' }
  | { type: 'stat'; metric: TutorialMetric; target: number };

/** 가이드 카드의 진행 표시에 쓰는 이름. 바꾸고 싶으면 여기만 고치면 됩니다. */
export const TUTORIAL_METRIC_LABELS: Record<TutorialMetric, string> = {
  shipments: '택배',
  replies: '답장',
  sales: '판매',
  bankTransactions: '은행 거래',
  day: '일차',
};


export interface TutorialStep {
  id: string;
  title: string;
  text: string;
  appId?: string;
  /** 주 신원에 따라 다른 앱을 안내할 때. 없으면 `appId` 사용. */
  appIdFor?: Partial<Record<IdentityKind, string>>;
  goal: TutorialGoal;
}

/**
 * 가이드 단계. 배열 순서 = 진행 순서.
 *
 * 초선일보(news)·구팡 수령(delivery)·포럼 주소(forum)·Maps 만남(map) 안내는
 * 사용자 요청(2026-10-29)으로 제거했습니다. 그 앱들은 그대로 있고, 가이드가
 * 시키지 않을 뿐입니다 — 다시 넣으려면 아래 배열에 객체 하나를 더하면 됩니다.
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'buy',
    appId: 'chroma',
    title: '정상 상점에서 소량 매입',
    text: 'Chroma에서는 .onion에 접속할 수 없습니다. 회색 상점에서 소량만 사두세요.',
    goal: { type: 'stat', metric: 'shipments', target: 1 },
  },
  {
    id: 'shade',
    appId: 'shade',
    title: '다크넷 도매',
    text: 'Shade에서만 .onion에 들어갈 수 있습니다. 로트 단위로 싸게 사입하세요.',
    goal: { type: 'openApp' },
  },
  {
    id: 'reply',
    appIdFor: { realname: 'messagesCall', alias: 'telegraph' },
    title: '손님 응대',
    text: '손님은 두 메신저 중 한 곳으로 먼저 연락합니다. 답장하면 약속이 잡힙니다.',
    goal: { type: 'stat', metric: 'replies', target: 1 },
  },
  {
    id: 'sell',
    appId: 'trade',
    title: '판매 실행',
    text: '거래 앱에서 손님을 응대하고 판매하세요. 모든 행동은 게임 시간을 씁니다.',
    goal: { type: 'stat', metric: 'sales', target: 1 },
  },
  {
    id: 'bank',
    appId: 'bank',
    title: '자금 정리',
    text: '현금이 너무 많으면 위험합니다. 초콜렛뱅크에 나눠 넣으세요.',
    goal: { type: 'stat', metric: 'bankTransactions', target: 5 },
  },
  {
    id: 'day',
    appId: 'trade',
    title: '하루 마감',
    text: '거래 앱 맨 아래에서 하루를 마감하세요. 월세·러너·압수 결과가 정산됩니다.',
    goal: { type: 'stat', metric: 'day', target: 2 },
  },
];
