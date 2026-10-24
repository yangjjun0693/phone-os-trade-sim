import { useEffect, useState } from 'react';

/**
 * Ticking `Date`. Kept tiny on purpose: only the components that render a live
 * clock subscribe to it.
 */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
