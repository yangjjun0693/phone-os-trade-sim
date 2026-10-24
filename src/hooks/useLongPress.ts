import { useCallback, useRef, type MouseEvent as ReactMouseEvent } from 'react';

interface LongPressOptions {
  delay?: number;
  onLongPress: () => void;
  onClick?: () => void;
}

/**
 * Pointer-based long press that also works with a mouse. Used for entering the
 * home-screen "jiggle" edit mode.
 */
export function useLongPress({ delay = 450, onLongPress, onClick }: LongPressOptions) {
  const timer = useRef<number | null>(null);
  const fired = useRef(false);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const start = useCallback(() => {
    fired.current = false;
    clear();
    timer.current = window.setTimeout(() => {
      fired.current = true;
      onLongPress();
    }, delay);
  }, [clear, delay, onLongPress]);

  const end = useCallback(() => {
    clear();
  }, [clear]);

  const click = useCallback(() => {
    if (fired.current) {
      fired.current = false;
      return;
    }
    onClick?.();
  }, [onClick]);

  return {
    onPointerDown: start,
    onPointerUp: end,
    onPointerLeave: end,
    onPointerCancel: end,
    onClick: click,
    onContextMenu: (event: ReactMouseEvent) => event.preventDefault(),
  };
}
