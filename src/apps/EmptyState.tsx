import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { SPRING_SOFT } from '@/utils/motion';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

/** Shared empty/placeholder panel used by every stub app for now. */
export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_SOFT}
      className="flex flex-col items-center justify-center gap-3 px-8 py-16 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, rotate: -6 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ ...SPRING_SOFT, delay: 0.05 }}
        className="flex size-16 items-center justify-center rounded-2xl bg-ios-surface shadow-sm"
      >
        <Icon className="size-7 text-ios-muted" aria-hidden />
      </motion.div>
      <p className="text-[17px] font-semibold">{title}</p>
      {description ? <p className="max-w-64 text-[13px] text-ios-muted">{description}</p> : null}
    </motion.div>
  );
}
