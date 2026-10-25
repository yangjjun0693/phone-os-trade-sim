import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SPRING_SNAPPY, prefersReducedMotion } from '@/utils/motion';

interface HamburgerButtonProps {
  onClick: () => void;
  open?: boolean;
  label?: string;
}

/** Three-line menu button with a 44px touch target. */
export function HamburgerButton({ onClick, open = false, label = '메뉴 열기' }: HamburgerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={open}
      className="-ml-1 flex size-11 items-center justify-center rounded-xl text-ios-text active:bg-ios-separator/15"
    >
      <svg className="size-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="4" y1="7" x2="20" y2="7" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="17" x2="20" y2="17" />
      </svg>
    </button>
  );
}

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label?: string;
}

const DRAWER_WIDTH = 300;

/**
 * Left slide-in drawer. Positioned absolutely, so the nearest `relative`
 * ancestor (the app body) is its bounds and it never leaks outside the phone.
 * Tap the scrim, press Escape or swipe left to close.
 */
export function SideDrawer({ open, onClose, children, label = '메뉴' }: SideDrawerProps) {
  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="absolute inset-0 z-30" role="dialog" aria-modal="true" aria-label={label}>
          <motion.button
            type="button"
            aria-label="메뉴 닫기"
            className="absolute inset-0 bg-black/55"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />
          <motion.aside
            className="absolute inset-y-0 left-0 flex flex-col overflow-hidden bg-ios-bg shadow-2xl ring-1 ring-inset ring-white/10"
            style={{ width: `min(${DRAWER_WIDTH}px, 84%)`, borderTopRightRadius: 20, borderBottomRightRadius: 20 }}
            initial={reduced ? false : { x: '-100%' }}
            animate={{ x: 0 }}
            exit={reduced ? undefined : { x: '-100%' }}
            transition={SPRING_SNAPPY}
            drag="x"
            dragConstraints={{ left: -DRAWER_WIDTH, right: 0 }}
            dragElastic={0.04}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70 || info.velocity.x < -450) onClose();
            }}
          >
            {children}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
