import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { SPRING_SNAPPY } from '@/utils/motion';
import { ISLAND_COLLAPSED, ISLAND_EXPANDED } from './metrics';

export interface DynamicIslandProps {
  /** Notifications will flip this later; the shell already animates it. */
  expanded?: boolean;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * CSS version of the Dynamic Island. The pill itself is a plain black capsule;
 * the collapsed/expanded sizes are the values measured from an iPhone 14 Pro
 * screenshot (see ATTRIBUTIONS.md).
 */
export function DynamicIsland({ expanded = false, children, className, onClick }: DynamicIslandProps) {
  const target = expanded ? ISLAND_EXPANDED : ISLAND_COLLAPSED;

  return (
    <motion.div
      initial={false}
      animate={{ width: target.width, height: target.height }}
      transition={SPRING_SNAPPY}
      onClick={onClick}
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-full bg-black',
        onClick && 'pointer-events-auto cursor-pointer',
        className,
      )}
      aria-hidden={!expanded}
    >
      {expanded ? (
        <div className="w-full px-4 text-[12px] text-white">{children}</div>
      ) : (
        <span className="relative size-full">
          {/* camera dot, purely cosmetic */}
          <span className="absolute right-3 top-1/2 size-[6px] -translate-y-1/2 rounded-full bg-[#151515]" />
        </span>
      )}
    </motion.div>
  );
}
