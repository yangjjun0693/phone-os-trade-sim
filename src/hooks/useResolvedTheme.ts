import { useEffect } from 'react';
import { useOSStore } from '@/store/osStore';
import type { ResolvedTheme } from '@/types';
import { useMediaQuery } from './useMediaQuery';

/**
 * Resolves `system | light | dark` down to a concrete theme and applies it to
 * <html>, so both Tailwind's `dark:` variant and CSS variables react.
 */
export function useResolvedTheme(): ResolvedTheme {
  const theme = useOSStore((s) => s.theme);
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const resolved: ResolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
  }, [resolved]);

  return resolved;
}
