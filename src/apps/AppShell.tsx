import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface AppShellProps {
  title: string;
  /** iOS "large title" style: small centred title that grows on scroll. */
  largeTitle?: boolean;
  trailing?: ReactNode;
  leading?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Standard in-app chrome: a blurred navigation bar that extends under the
 * status bar, plus a scrollable content region.
 */
export function AppShell({
  title,
  largeTitle = false,
  trailing,
  leading,
  children,
  className,
}: AppShellProps) {
  return (
    <div className={cn('flex h-full flex-col bg-ios-bg text-ios-text', className)}>
      <header className="relative z-10 shrink-0 pt-[var(--ios-statusbar-h)]">
        <div className="glass-strong relative flex h-[var(--ios-navbar-h)] items-center justify-between border-b border-ios-separator/20 px-3">
          <div className="flex min-w-11 items-center">{leading}</div>
          <span
            className={cn(
              'pointer-events-none absolute inset-x-0 text-center text-[17px] font-semibold',
              largeTitle ? 'opacity-100 transition-opacity' : 'opacity-100',
            )}
          >
            {title}
          </span>
          <div className="flex min-w-11 items-center justify-end gap-3">{trailing}</div>
        </div>
      </header>

      <div className="scroll-area no-scrollbar relative flex-1">
        {largeTitle ? (
          <h1 className="px-4 pb-2 pt-2 text-[34px] font-bold tracking-tight">{title}</h1>
        ) : null}
        {children}
      </div>
    </div>
  );
}
