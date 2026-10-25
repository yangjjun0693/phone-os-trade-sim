import type { Transition, Variants } from 'framer-motion';

/** Default iOS-ish easing curve for non-spring tweens. */
export const EASE_IOS = [0.32, 0.72, 0, 1] as const;
/** Gentler ease for fades and colour tweens. */
export const EASE_SOFT = [0.4, 0, 0.2, 1] as const;

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

/* ------------------------------------------------------------------ *
 * Reusable variants.
 *
 * These are intentionally transform/opacity-only so they stay on the
 * compositor. `MotionConfig reducedMotion="user"` (see App.tsx) strips the
 * transform half automatically when the user asks for less motion.
 * ------------------------------------------------------------------ */

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.28, ease: EASE_IOS } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: SPRING_SOFT },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  show: { opacity: 1, y: 0, transition: SPRING_SNAPPY },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: SPRING_BOUNCY },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  show: { opacity: 1, x: 0, transition: SPRING_SNAPPY },
  exit: { opacity: 0, x: 32, transition: { duration: 0.16, ease: EASE_IOS } },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: SPRING_SNAPPY },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15, ease: EASE_IOS } },
};

export const popListItem: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: SPRING_BOUNCY },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.14, ease: EASE_IOS } },
};

/** Parent that staggers its children in. Spread on a motion container. */
export function staggerContainer(stagger = 0.05, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren } },
  };
}

/** Cheap "appearing screen" used by every app body. */
export const screenVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.995 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: EASE_IOS } },
};

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
