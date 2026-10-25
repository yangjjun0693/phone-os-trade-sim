import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { SPRING_SOFT } from '@/utils/motion';

export function Section({
  header,
  footer,
  children,
  delay = 0,
  className,
}: {
  header?: string;
  footer?: string;
  children: ReactNode;
  /** Stagger sibling sections by passing an increasing delay. */
  delay?: number;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_SOFT, delay: Math.min(delay, 0.4) }}
      className={cn('mb-6', className)}
    >
      {header ? (
        <h2 className="px-4 pb-1.5 pt-2 text-[13px] font-medium uppercase tracking-wide text-ios-muted">
          {header}
        </h2>
      ) : null}
      <div className="mx-4 overflow-hidden rounded-2xl bg-ios-surface shadow-sm ring-1 ring-black/5 dark:ring-white/5">
        {children}
      </div>
      {footer ? <p className="px-4 pt-1.5 text-[12px] text-ios-muted">{footer}</p> : null}
    </motion.section>
  );
}

export function Row({
  icon,
  title,
  subtitle,
  value,
  trailing,
  onClick,
  className,
  animateIn,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  value?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
  /** Row index for a soft staggered slide-in. Omit to render statically. */
  animateIn?: number;
}) {
  const interactive = Boolean(onClick);
  const content = (
    <>
      {icon ? <span className="flex w-7 shrink-0 justify-center">{icon}</span> : null}
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[16px]">{title}</span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-[12px] text-ios-muted">{subtitle}</span>
        ) : null}
      </span>
      {value ? <span className="shrink-0 text-[15px] text-ios-muted">{value}</span> : null}
      {trailing}
    </>
  );

  const classes = cn(
    'flex w-full items-center gap-3 border-b border-ios-separator/15 px-4 py-2.5 last:border-b-0',
    interactive && 'active:bg-ios-separator/10',
    className,
  );

  const motionProps =
    animateIn === undefined
      ? {}
      : {
          initial: { opacity: 0, x: -16 },
          animate: { opacity: 1, x: 0 },
          transition: { ...SPRING_SOFT, delay: 0.05 + animateIn * 0.04 },
        };

  if (interactive) {
    return (
      <motion.button type="button" className={classes} onClick={onClick} {...motionProps}>
        {content}
      </motion.button>
    );
  }
  return (
    <motion.div className={classes} {...motionProps}>
      {content}
    </motion.div>
  );
}
