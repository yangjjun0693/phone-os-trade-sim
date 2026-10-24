import { nanoid } from 'nanoid';
import type { Rng } from './customers';
import { clamp } from './pricing';

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  heatDelta: number;
  cashDelta: number;
}

/** Blurb-only random events. Tone is black comedy; no real-world methods. */
const TABLE: Omit<GameEvent, 'id'>[] = [
  {
    title: '이웃의 신고',
    description: '옆집에서 "이상한 냄새"라며 신고를 넣었다는 소문이 돌았다.',
    heatDelta: 6,
    cashDelta: 0,
  },
  {
    title: '단골의 팁',
    description: '만족한 단골이 웃돈을 얹어 갔다.',
    heatDelta: 0,
    cashDelta: 120,
  },
  {
    title: '순찰차 정박',
    description: '같은 블록에 순찰차가 오래 머문다. 오늘은 조용히 있는 게 좋겠다.',
    heatDelta: 10,
    cashDelta: 0,
  },
  {
    title: '재고 손실',
    description: '보관하던 물건 일부가 습기로 못 쓰게 됐다.',
    heatDelta: 0,
    cashDelta: -60,
  },
];

/** Returns `null` when nothing happens this tick. */
export function rollEvent(rng: Rng, chance = 0.25): GameEvent | null {
  if (rng() > chance) return null;
  const template = TABLE[Math.floor(rng() * TABLE.length) % TABLE.length];
  return {
    id: nanoid(8),
    ...template,
    heatDelta: clamp(template.heatDelta, -100, 100),
  };
}
