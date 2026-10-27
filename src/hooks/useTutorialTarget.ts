import { TUTORIAL_STEPS } from '@/content/tutorial';
import { stepAppId } from '@/game/tutorial';
import { useTutorialStore } from '@/store/tutorialStore';

/**
 * The app the guide is currently pointing at, or `null` when the guide is off
 * (or finished). Home icons use this to draw a subtle highlight, so the player
 * can see where to go without the guide blocking the screen.
 */
export function useTutorialTargetApp(): string | null {
  const active = useTutorialStore((s) => s.active);
  const setupDone = useTutorialStore((s) => s.setupDone);
  const stepIndex = useTutorialStore((s) => s.stepIndex);
  const identity = useTutorialStore((s) => s.defaultIdentity);
  const step = TUTORIAL_STEPS[stepIndex];
  if (!active || !setupDone || !step) return null;
  return stepAppId(step, identity) ?? null;
}
