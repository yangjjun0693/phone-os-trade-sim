import { useState, type ReactNode } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { cn } from '@/utils/cn';
import { EASE_IOS, SPRING_SNAPPY } from '@/utils/motion';

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
 *
 * The header drops in and the body fades up on entry, and a hairline at the
 * bottom of the bar fills as you scroll — all driven by motion values so the
 * scroll path never re-renders the tree.
 */
export function AppShell({
  title,
  largeTitle = false,
  trailing,
  leading,
  children,
  className,
}: AppShellProps) {
  const [scrolled, setScrolled] = useState(false);
  const progress = useMotionValue(0);

  return (
    <div className={cn('flex h-full flex-col bg-ios-bg text-ios-text', className)}>
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_SNAPPY}
        className="relative z-10 shrink-0 pt-[var(--ios-statusbar-h)]"
      >
        <div className="glass-strong relative flex h-[var(--ios-navbar-h)] items-center justify-between border-b border-app/25 px-3">
          <div className="flex min-w-11 items-center">{leading}</div>
          <span
            className={cn(
              'pointer-events-none absolute inset-x-0 text-center text-[17px] font-semibold text-app transition-opacity duration-150',
              largeTitle && !scrolled ? 'opacity-0' : 'opacity-100',
            )}
          >
            {title}
          </span>
          <div className="flex min-w-11 items-center justify-end gap-3">{trailing}</div>
          <motion.span
            style={{ scaleX: progress }}
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left rounded-full bg-app/70"
            aria-hidden
          />
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: EASE_IOS }}
        className="scroll-area no-scrollbar relative flex-1"
        onScroll={(event) => {
          const el = event.currentTarget;
          if (largeTitle) setScrolled(el.scrollTop > 36);
          progress.set(el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight));
        }}
      >
        {largeTitle ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_SNAPPY, delay: 0.03 }}
            className="px-4 pb-2 pt-2"
          >
            <h1 className="text-[34px] font-bold tracking-tight">{title}</h1>
            <span className="mt-1 block h-[3px] w-10 rounded-full bg-app/70" aria-hidden />
          </motion.div>
        ) : null}
        {children}
      </motion.div>
    </div>
  );
}
