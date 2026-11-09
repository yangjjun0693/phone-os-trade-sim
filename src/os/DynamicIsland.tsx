import { AnimatePresence, motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { cn } from '@/utils/cn';
import { SPRING_SNAPPY } from '@/utils/motion';
import { ISLAND_COLLAPSED } from './metrics';

/**
 * Height the pill keeps while expanded (matches the collapsed capsule) and the
 * width it grows to so an icon plus a truncated title fit without wrapping.
 */
const ISLAND_EXPANDED_WIDTH = 224;

export interface DynamicIslandProps {
  className?: string;
  onClick?: () => void;
  /**
   * When present the capsule expands to announce a notification. `appId` is
   * carried for callers that want it, but the tap target is `onPillTap`.
   */
  pill?: { title: string; appId?: string };
  /** Tap handler while expanded; deep-links to the notification's app. */
  onPillTap?: () => void;
}

/**
 * CSS version of the Dynamic Island. The pill itself is a plain black capsule;
 * the collapsed size is the value measured from an iPhone 14 Pro screenshot
 * (see ATTRIBUTIONS.md). With a `pill` it grows into an expanded capsule that
 * briefly surfaces a high/urgent notification.
 */
export function DynamicIsland({ className, onClick, pill, onPillTap }: DynamicIslandProps) {
  const expanded = Boolean(pill);
  const interactive = onClick || onPillTap;
  // While expanded the capsule is a deep-link; collapsed it opens the shade.
  const handleClick = expanded && onPillTap ? onPillTap : onClick;

  return (
    <motion.div
      onClick={handleClick}
      initial={false}
      animate={{ width: expanded ? ISLAND_EXPANDED_WIDTH : ISLAND_COLLAPSED.width }}
      transition={SPRING_SNAPPY}
      style={{ height: ISLAND_COLLAPSED.height }}
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-full bg-black',
        'ring-1 ring-inset ring-white/[0.06]',
        interactive && 'pointer-events-auto cursor-pointer',
        className,
      )}
      aria-hidden
    >
      <AnimatePresence initial={false}>
        {pill ? (
          <motion.span
            key="pill"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex w-full items-center gap-2 pl-5 pr-8 text-white"
          >
            <Bell className="size-[15px] shrink-0 text-ios-green" strokeWidth={2.4} aria-hidden />
            <span className="truncate text-[13px] font-semibold leading-none">{pill.title}</span>
          </motion.span>
        ) : null}
      </AnimatePresence>

      {/* camera dot, purely cosmetic */}
      <span
        className={cn(
          'absolute top-1/2 size-[6px] -translate-y-1/2 rounded-full bg-[#151515]',
          expanded ? 'right-5' : 'right-3',
        )}
      />
    </motion.div>
  );
}
