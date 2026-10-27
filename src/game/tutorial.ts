/**
 * Tutorial rules, kept pure so the guide can be unit-tested without React.
 *
 * The guide is intentionally *not* a gate: it never locks apps. Each step just
 * watches one number (or a visited app) and ticks itself off when the player
 * gets there, so the player can wander off and come back.
 */
import type { IdentityKind } from '@/types';
import type { TutorialStep } from '@/content/tutorial';

/** One read-only view of the game, taken at render time. */
export interface TutorialSnapshot {
  /** Apps opened at least once (tracked by the OS as the player plays). */
  openedApps: string[];
  /** Total units in the player's stock. */
  inventory: number;
  /** Parcels that exist (in transit or waiting). */
  shipments: number;
  /** Onion addresses the player has learned. */
  markets: number;
  /** Threads the player has answered. */
  replies: number;
  sales: number;
  bankTransactions: number;
  day: number;
}

export const EMPTY_TUTORIAL_SNAPSHOT: TutorialSnapshot = {
  openedApps: [],
  inventory: 0,
  shipments: 0,
  markets: 0,
  replies: 0,
  sales: 0,
  bankTransactions: 0,
  day: 1,
};

/** The app a step points at, honouring the player's primary identity. */
export function stepAppId(step: TutorialStep, identity: IdentityKind): string | undefined {
  return step.appIdFor?.[identity] ?? step.appId;
}

/** Has the player reached this step's goal yet? */
export function isTutorialStepComplete(
  step: TutorialStep,
  snapshot: TutorialSnapshot,
  identity: IdentityKind,
): boolean {
  if (step.goal.type === 'openApp') {
    const appId = stepAppId(step, identity);
    return Boolean(appId) && snapshot.openedApps.includes(appId as string);
  }

  const value = snapshot[step.goal.metric] ?? 0;
  return value >= step.goal.target;
}

/** Index of the first step that is not finished yet; `steps.length` when done. */
export function firstUnfinishedStep(done: string[], steps: TutorialStep[]): number {
  const index = steps.findIndex((step) => !done.includes(step.id));
  return index === -1 ? steps.length : index;
}

/** "n / total" progress for the guide header. */
export function tutorialProgress(
  done: string[],
  total: number,
): { done: number; total: number; percent: number } {
  const count = Math.min(total, Math.max(0, done.length));
  return {
    done: count,
    total,
    percent: total > 0 ? Math.round((count / total) * 100) : 0,
  };
}

/** Fill `{name}` in the intro's final line. */
export function introFinalLine(template: string, name: string): string {
  return template.replaceAll('{name}', name.trim() || '지훈');
}
