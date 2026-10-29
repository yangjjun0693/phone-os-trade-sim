import { describe, expect, it } from 'vitest';
import { TUTORIAL_STEPS } from '@/content/tutorial';
import {
  EMPTY_TUTORIAL_SNAPSHOT,
  firstUnfinishedStep,
  introFinalLine,
  isTutorialStepComplete,
  stepAppId,
  tutorialProgress,
  type TutorialSnapshot,
} from './tutorial';

const step = (id: string) => {
  const found = TUTORIAL_STEPS.find((item) => item.id === id);
  if (!found) throw new Error(`missing step ${id}`);
  return found;
};

const snapshot = (patch: Partial<TutorialSnapshot> = {}): TutorialSnapshot => ({
  ...EMPTY_TUTORIAL_SNAPSHOT,
  ...patch,
});

describe('tutorial rules', () => {
  it('completes an "open app" step only once that app was opened', () => {
    const shade = step('shade');
    expect(isTutorialStepComplete(shade, snapshot(), 'alias')).toBe(false);
    expect(
      isTutorialStepComplete(shade, snapshot({ openedApps: ['wallet', 'shade'] }), 'alias'),
    ).toBe(true);
  });

  it('lets the chosen identity pick the messenger the guide points at', () => {
    const reply = step('reply');
    expect(stepAppId(reply, 'alias')).toBe('telegraph');
    expect(stepAppId(reply, 'realname')).toBe('messagesCall');
    // The messenger choice changes the recommendation, not the actual goal:
    // answering one thread completes the step whichever app it arrived in.
    expect(isTutorialStepComplete(reply, snapshot({ replies: 1 }), 'alias')).toBe(true);
    expect(isTutorialStepComplete(reply, snapshot({ replies: 1 }), 'realname')).toBe(true);
  });

  it('compares stat goals against the snapshot', () => {
    expect(isTutorialStepComplete(step('buy'), snapshot({ shipments: 0 }), 'alias')).toBe(false);
    expect(isTutorialStepComplete(step('buy'), snapshot({ shipments: 1 }), 'alias')).toBe(true);
    expect(isTutorialStepComplete(step('day'), snapshot({ day: 2 }), 'alias')).toBe(true);
    expect(isTutorialStepComplete(step('bank'), snapshot({ bankTransactions: 4 }), 'alias')).toBe(
      false,
    );
  });

  it('finds the first unfinished step, not just the next array index', () => {
    expect(firstUnfinishedStep([], TUTORIAL_STEPS)).toBe(0);
    expect(firstUnfinishedStep(['buy'], TUTORIAL_STEPS)).toBe(1);
    expect(firstUnfinishedStep(['buy', 'shade'], TUTORIAL_STEPS)).toBe(2);
    // Out-of-order completion still resumes at the earliest gap.
    expect(firstUnfinishedStep(['shade'], TUTORIAL_STEPS)).toBe(0);
    expect(firstUnfinishedStep(TUTORIAL_STEPS.map((item) => item.id), TUTORIAL_STEPS)).toBe(
      TUTORIAL_STEPS.length,
    );
  });

  it('reports progress as a clamped percentage', () => {
    expect(tutorialProgress([], 10)).toEqual({ done: 0, total: 10, percent: 0 });
    expect(tutorialProgress(['a', 'b', 'c'], 10)).toEqual({ done: 3, total: 10, percent: 30 });
    expect(tutorialProgress(['a', 'b', 'c', 'd'], 2)).toEqual({ done: 2, total: 2, percent: 100 });
    expect(tutorialProgress([], 0)).toEqual({ done: 0, total: 0, percent: 0 });
  });

  it('fills the intro line and falls back when the name is blank', () => {
    expect(introFinalLine('안녕, {name}', ' 박서준 ')).toBe('안녕, 박서준');
    expect(introFinalLine('안녕, {name}', '   ')).toBe('안녕, 지훈');
  });
});
