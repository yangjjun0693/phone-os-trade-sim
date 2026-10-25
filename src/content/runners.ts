/**
 * 러너(자동 판매) — 편집 방법
 *
 *  - `content`/`data` 의 npcs.json 에 있는 사람만 고용할 수 있습니다.
 *  - 고용비를 내면 그날부터 **하루 마감 때 자동 수익**이 들어옵니다.
 *  - `catchChance` 확률로 그날 잡히고, 잡히면 러너를 잃고 heat가 오릅니다.
 *    heat가 높을수록 더 잘 잡힙니다(엔진이 보정).
 */
export interface RunnerTemplate {
  npcId: string;
  /** 고용비. */
  hireCost: number;
  /** 하루 순수익(내 몫). */
  dailyNet: number;
  /** 기본 적발 확률. */
  catchChance: number;
  note: string;
}

export const RUNNERS: RunnerTemplate[] = [
  {
    npcId: 'npc-min',
    hireCost: 120_000,
    dailyNet: 90_000,
    catchChance: 0.05,
    note: '말이 없고 실수가 적다. 수익은 평범.',
  },
  {
    npcId: 'npc-sol',
    hireCost: 200_000,
    dailyNet: 160_000,
    catchChance: 0.12,
    note: '대학가에서 소량을 자주 판다. 사람이 많아 눈에 띈다.',
  },
  {
    npcId: 'npc-park',
    hireCost: 320_000,
    dailyNet: 240_000,
    catchChance: 0.08,
    note: '주차장·터미널 쪽에 밝다. 값이 세다.',
  },
];

export function findRunner(npcId: string): RunnerTemplate | undefined {
  return RUNNERS.find((runner) => runner.npcId === npcId);
}
