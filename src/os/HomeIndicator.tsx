import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

/** The 140×5 capsule at the bottom of every modern iPhone. */
export function HomeIndicator({ className }: { className?: string }) {
  return (
    <div
      className={cn('pointer-events-none absolute bottom-2 left-1/2 z-50 -translate-x-1/2', className)}
    >
      <motion.span
        initial={{ opacity: 0, scaleX: 0.4 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.25, type: 'spring', stiffness: 220, damping: 24 }}
        className="block h-[5px] w-[140px] rounded-full bg-white/90 mix-blend-difference"
      />
    </div>
  );
}
