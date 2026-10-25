import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { SPRING_BOUNCY } from '@/utils/motion';

export type PillTone =
  | 'neutral'
  | 'accent'
  | 'green'
  | 'red'
  | 'orange'
  | 'blue'
  | 'purple'
  | 'yellow';

const TONE: Record<PillTone, string> = {
  neutral: 'bg-ios-separator/15 text-ios-muted',
  accent: 'bg-ios-accent/15 text-ios-accent',
  green: 'bg-ios-green/15 text-ios-green',
  red: 'bg-ios-red/15 text-ios-red',
  orange: 'bg-ios-orange/15 text-ios-orange',
  blue: 'bg-ios-blue/15 text-ios-blue',
  purple: 'bg-ios-purple/15 text-ios-purple',
  yellow: 'bg-ios-yellow/20 text-ios-yellow',
};

interface PillProps {
  children: ReactNode;
  tone?: PillTone;
  icon?: ReactNode;
  className?: string;
  /** Pop in on mount. */
  animate?: boolean;
}

/**
 * A small labelled capsule. Every badge, tag and status chip in the game uses
 * this so they share one soft spring entrance and one visual language.
 */
export function Pill({
  children,
  tone = 'neutral',
  icon,
  className,
  animate = true,
}: PillProps) {
  return (
    <motion.span
      layout
      initial={animate ? { opacity: 0, scale: 0.8 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={SPRING_BOUNCY}
      className={cn(
        'relative inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none',
        TONE[tone],
        className,
      )}
    >
      {icon ? <span className="relative flex items-center">{icon}</span> : null}
      <span className="relative">{children}</span>
    </motion.span>
  );
}
