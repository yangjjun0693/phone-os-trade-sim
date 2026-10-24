import type { Transition } from 'framer-motion';

/**
 * iOS-ish spring presets. Timings are approximations taken from screen
 * recordings; see ATTRIBUTIONS.md.
 */
export const SPRING_SNAPPY: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

export const SPRING_SOFT: Transition = {
  type: 'spring',
  stiffness: 210,
  damping: 26,
  mass: 0.9,
};

export const SPRING_BOUNCY: Transition = {
  type: 'spring',
  stiffness: 520,
  damping: 34,
  mass: 0.7,
};

/** Whether the user asked the OS to reduce motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
