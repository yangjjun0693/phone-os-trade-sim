export interface ParcelStage {
  label: string;
  /** Hours after `orderedAt` when this stage is reached. */
  atHours: number;
}

export interface Parcel {
  id: string;
  label: string;
  sender: string;
  trackingNo: string;
  /** Game-time ISO. */
  orderedAt: string;
  stages: ParcelStage[];
  /** Extra hours the parcel is stuck at its current stage (delay). */
  delayHours?: number;
  /** Stage index where the parcel is put on hold (inspection) and never moves on. */
  holdAtStage?: number;
}

export type ParcelState = 'moving' | 'delivered' | 'delayed' | 'held';

export interface ParcelProgress {
  /** Index of the last reached stage, or -1 if none. */
  stageIndex: number;
  state: ParcelState;
}

export const PARCEL_STATE_LABEL: Record<ParcelState, string> = {
  moving: '이동 중',
  delivered: '배송 완료',
  delayed: '배송 지연',
  held: '검수 보류',
};

/** Stage index from which `delayHours` pushes every later stage back. */
const DELAY_FROM_STAGE = 2;

export function parcelProgress(parcel: Parcel, nowIso: string): ParcelProgress {
  const hours = (new Date(nowIso).getTime() - new Date(parcel.orderedAt).getTime()) / 3_600_000;
  const delay = parcel.delayHours ?? 0;
  const effective = (stage: ParcelStage, index: number) =>
    stage.atHours + (index >= DELAY_FROM_STAGE ? delay : 0);

  let stageIndex = -1;
  parcel.stages.forEach((stage, index) => {
    if (hours >= effective(stage, index)) stageIndex = index;
  });

  if (parcel.holdAtStage !== undefined && stageIndex >= parcel.holdAtStage) {
    return { stageIndex: parcel.holdAtStage, state: 'held' };
  }

  const delayStage = parcel.stages[DELAY_FROM_STAGE];
  const stuck =
    delay > 0 && delayStage !== undefined && hours >= delayStage.atHours && hours < delayStage.atHours + delay;
  if (stuck) return { stageIndex: DELAY_FROM_STAGE - 1, state: 'delayed' };

  if (stageIndex >= parcel.stages.length - 1) return { stageIndex, state: 'delivered' };
  return { stageIndex, state: 'moving' };
}
