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

export const SPRING_GENTLE: Transition = {
  type: 'spring',
  stiffness: 180,
  damping: 22,
  mass: 1.0,
};

export const SPRING_STIFF: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 35,
  mass: 0.6,
};

/** Spring token mapping for different UI purposes. */
export const MOTION_TOKENS = {
  /** Navigation push/pop */
  navigation: SPRING_SNAPPY,
  /** Modal sheets from bottom */
  sheet: SPRING_SOFT,
  /** Button press, tap feedback */
  tap: SPRING_BOUNCY,
  /** List item press */
  listPress: { type: 'spring', stiffness: 300, damping: 25, mass: 0.7 },
  /** Card expand/collapse */
  card: SPRING_SOFT,
  /** Toast/banner animations */
  toast: SPRING_SNAPPY,
  /** Skeleton loading pulse */
  skeleton: { type: 'spring', stiffness: 150, damping: 20, mass: 1.2 },
  /** Pull to refresh */
  refresh: SPRING_SOFT,
  /** Swipe actions */
  swipe: SPRING_SNAPPY,
} as const;

/** Whether the user asked the OS to reduce motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Get a transition respecting reduced motion preference. */
export function getTransition(token: keyof typeof MOTION_TOKENS, custom?: Transition): Transition {
  if (prefersReducedMotion()) {
    return { duration: 0.01, ...custom };
  }
  return { ...MOTION_TOKENS[token], ...custom };
}
