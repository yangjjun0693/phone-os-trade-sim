/**
 * 게임 시계 — 편집 방법
 *
 *  - `MINUTES_PER_TICK` : 시계가 한 번에 건너뛰는 **게임 분** (기본 5분 단위)
 *  - `realMinutesPerDay` : 게임 하루(1440분)가 실제로 걸리는 **실시간 분**
 *      느리게 30분 / 보통 15분 / 빠르게 8분
 *  - 계산: tickMs = 실시간분 × 60,000 ÷ (1440 ÷ MINUTES_PER_TICK)
 *      보통(15분) → 900,000ms ÷ 288틱 = 3,125ms  (5게임분 = 약 3.1초)
 *
 * 배송·약속·메시지 도착은 모두 "게임 시간"으로 정해져 있으므로, 속도를 바꾸면
 * 실시간 체감도 같이 짧아집니다. 각 콘텐츠의 기한은 보통(15분) 기준으로 잡았습니다.
 */

export type ClockSpeed = 'slow' | 'normal' | 'fast';

export interface ClockPreset {
  id: ClockSpeed;
  label: string;
  /** 게임 하루가 걸리는 실시간 분. */
  realMinutesPerDay: number;
}

export const CLOCK_PRESETS: ClockPreset[] = [
  { id: 'slow', label: '느리게', realMinutesPerDay: 30 },
  { id: 'normal', label: '보통', realMinutesPerDay: 15 },
  { id: 'fast', label: '빠르게', realMinutesPerDay: 8 },
];

export const DEFAULT_CLOCK_SPEED: ClockSpeed = 'normal';
export const GAME_MINUTES_PER_DAY = 24 * 60;
/** 시계가 한 번에 진행하는 게임 분. */
export const MINUTES_PER_TICK = 5;
/** 하루에 필요한 틱 수. */
export const TICKS_PER_DAY = GAME_MINUTES_PER_DAY / MINUTES_PER_TICK;

export function clockPreset(speed: ClockSpeed = DEFAULT_CLOCK_SPEED): ClockPreset {
  return CLOCK_PRESETS.find((preset) => preset.id === speed) ?? CLOCK_PRESETS[1];
}

export function realMinutesPerDay(speed: ClockSpeed = DEFAULT_CLOCK_SPEED): number {
  return clockPreset(speed).realMinutesPerDay;
}

/** 한 틱(게임 5분)에 걸리는 실시간 밀리초. */
export function tickMs(speed: ClockSpeed = DEFAULT_CLOCK_SPEED): number {
  return (realMinutesPerDay(speed) * 60_000) / TICKS_PER_DAY;
}

/** 실시간 1초에 흐르는 게임 분(표시용). */
export function minutesPerSecond(speed: ClockSpeed = DEFAULT_CLOCK_SPEED): number {
  return GAME_MINUTES_PER_DAY / (realMinutesPerDay(speed) * 60);
}
