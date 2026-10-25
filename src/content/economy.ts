/**
 * Economy — 모든 게임 밸런스 수치의 단일 소스(single source of truth).
 *
 * 편집 방법
 *  - 숫자만 바꾸면 됩니다. 다른 코드는 이 파일을 import 해서 씁니다.
 *  - 통화는 원화(₩). 모든 값은 1원 단위 정수.
 *  - 기준 환율: ₩1,300 = $1 (문서화용 기준일 뿐, 실제 환율과 연동하지 않습니다.)
 *  - 밸런스 감각: `하루 순이익 ≈ (마켓 수 × 로트 수 × 로트 수익) − 월세 − 사고 손실`
 *
 * 관련 파일: src/game/trade.ts, src/game/heat.ts, src/game/bank.ts,
 *            src/game/events.ts, src/data/products.json
 */

/* ── 시작 자금 ───────────────────────────────────────────── */
/** 시작 현금 (손에 들고 있는 돈). */
export const START_CASH = 1_500_000;
/**
 * 시작 예금 (초콜렛뱅크 잔액). 월세 약 5일치 — 초반 긴장감을 위해 낮게 시작.
 * (급여 입금/월세 이체 시드 내역과 어울리는 "평범한 직장인 저축" 수준)
 */
export const START_BANK = 2_500_000;
/** 시작 steak 칩 (1칩 = ₩1). */
export const START_CHIPS = 250_000;

/* ── 목표 / 기간 ─────────────────────────────────────────── */
/**
 * 은퇴 목표: 현금 + 예금 합계가 이 값에 도달하면 클리어.
 * Phase 5에서 품목 11종·스페셜 3종·러너가 들어와 상한이 올라가 ₩1,500만 → ₩2,500만으로 조정.
 * (밸런스 가드: economy.test.ts 의 "하루 루프는 이길 수 있지만 자명하진 않다")
 */
export const RETIRE_GOAL = 25_000_000;

/* ── 재고/보관 ──────────────────────────────────────────── */
/** 한 곳에 보관할 수 있는 최대 수량(단위). 초과분은 위험해진다. */
export const STORAGE_CAPACITY = 60;
/** 초과 1단위당 하루 마감 시 붙는 heat. */
export const STORAGE_OVERHEAT = 0.4;
/** 재고가 넘친 상태에서 압수(raid)될 기본 확률. */
export const RAID_BASE_CHANCE = 0.06;
/** 압수되면 재고의 이 비율을 잃는다. */
export const RAID_LOSS_RATIO = 0.4;
/** 러너 적발 시 오르는 heat. */
export const RUNNER_CAUGHT_HEAT = 8;
/** 잡힌 러너가 흘리는 정보로 잃는 신뢰. */
export const RUNNER_CAUGHT_TRUST = 4;
/** 이 일수가 지나면 런 종료. */
export const MAX_DAYS = 30;

/* ── 하루 지출 ───────────────────────────────────────────── *
 * 월세(₩450,000/월)의 일할 + 생활비. 매일 마감할 때 빠져나갑니다.
 * 상승분은 "생활이 어려워진다"는 서사용이며, 최대 ₩65,000/일에서 멈춥니다.
 * ───────────────────────────────────────────────────────── */
/** 1일차 하루 지출. */
export const RENT_BASE = 25_000;
/** 며칠마다 오르는 지출. */
export const RENT_STEP = 2_000;
/** 지출이 더 오르지 않는 일차. */
export const RENT_STEP_MAX_DAY = 20;

/* ── heat ───────────────────────────────────────────────── */
/** 하루 마감 시 heat 냉각 시간(게임 시간). */
export const DAY_END_HEAT_DECAY_HOURS = 24;
/** 이 현금까지는 보관 위험이 없음. */
export const HEAT_CASH_SAFE = 500_000;
/** 초과분 이 금액마다 heat 1. */
export const HEAT_CASH_PER_STEP = 250_000;
/** 현금 보유로 얻는 heat 상한. */
export const HEAT_CASH_MAX = 20;
/** 월세를 못 냈을 때 추가 heat. */
export const HEAT_UNPAID_RENT = 8;

/* ── 은행 ───────────────────────────────────────────────── */
/** 이 금액 이상 입금은 이상거래로 본다. */
export const LARGE_DEPOSIT = 1_000_000;
/** 반복 입금 판정 창(시간). */
export const FREQUENT_WINDOW_HOURS = 24;
/** 창 안에서 이 횟수 이상이면 반복 입금. */
export const FREQUENT_COUNT = 3;
/** 고액 입금 heat. */
export const DEPOSIT_HEAT_LARGE = 8;
/** 반복 입금 heat. */
export const DEPOSIT_HEAT_FREQUENT = 5;

/* ── 랜덤 이벤트 ─────────────────────────────────────────── */
/** 단골의 팁. */
export const EVENT_TIP_CASH = 150_000;
/** 재고 손실. */
export const EVENT_LOSS_CASH = -120_000;

/* ── UI 퀵 금액 ─────────────────────────────────────────── */
/** 은행 입출금 화면의 퀵 버튼. */
export const BANK_QUICK_AMOUNTS = [100_000, 500_000, 1_000_000];
/** steak 칩 충전/환전/베팅 퀵 버튼. */
export const CHIP_QUICK_AMOUNTS = [10_000, 50_000, 100_000];
