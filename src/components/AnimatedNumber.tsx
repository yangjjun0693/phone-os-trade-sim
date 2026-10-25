import { useCallback, useEffect, useRef, useState } from 'react';
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from 'framer-motion';
import { EASE_IOS } from '@/utils/motion';

interface AnimatedNumberProps {
  value: number;
  /** Formats the in-flight value. Defaults to a rounded integer string. */
  format?: (value: number) => string;
  className?: string;
  duration?: number;
  /** Roll up from zero the first time it mounts. Off by default so tests
   *  (and screenshots) always see the settled value immediately. */
  animateOnMount?: boolean;
}

/**
 * A number that tweens to its new value instead of snapping. Mount renders the
 * settled value, so nothing flickers on first paint — only later changes roll.
 */
export function AnimatedNumber({
  value,
  format,
  className,
  duration = 0.7,
  animateOnMount = false,
}: AnimatedNumberProps) {
  const reduced = useReducedMotion();
  const formatRef = useRef(format);
  formatRef.current = format;

  const formatValue = useCallback(
    (n: number) => (formatRef.current ? formatRef.current(n) : String(Math.round(n))),
    [],
  );

  const initial = animateOnMount && !reduced ? 0 : value;
  const motionValue = useMotionValue(initial);
  const [text, setText] = useState(() => formatValue(initial));

  useMotionValueEvent(motionValue, 'change', (latest) => {
    setText(formatValue(latest));
  });

  useEffect(() => {
    const controls = animate(
      motionValue,
      value,
      reduced ? { duration: 0 } : { duration, ease: EASE_IOS },
    );
    return () => controls.stop();
  }, [value, reduced, duration, motionValue]);

  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {text}
    </span>
  );
}
