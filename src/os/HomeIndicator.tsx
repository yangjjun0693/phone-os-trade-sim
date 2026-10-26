import { motion } from 'framer-motion';
import { useOSStore } from '@/store/osStore';
import { cn } from '@/utils/cn';

/**
 * The 140×5 capsule at the bottom of every modern iPhone — and, here, a real
 * escape hatch: tapping it always closes an open overlay or returns home, so a
 * player can never be stranded inside an app.
 */
export function HomeIndicator({ className }: { className?: string }) {
  const locked = useOSStore((s) => s.locked);
  const openAppId = useOSStore((s) => s.openAppId);
  const overlay = useOSStore((s) => s.overlay);
  const goHome = useOSStore((s) => s.goHome);
  const setOverlay = useOSStore((s) => s.setOverlay);

  const escape = () => {
    if (locked) return;
    if (overlay !== 'none') {
      setOverlay('none');
      return;
    }
    if (openAppId) goHome();
  };

  return (
    <div className={cn('absolute bottom-0 left-1/2 z-50 -translate-x-1/2', className)}>
      <button
        type="button"
        aria-label="홈으로"
        onClick={escape}
        className="flex h-6 w-[180px] items-end justify-center pb-2"
      >
        <motion.span
          initial={{ opacity: 0, scaleX: 0.4 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 220, damping: 24 }}
          className="block h-[5px] w-[140px] rounded-full bg-white/90 mix-blend-difference"
        />
      </button>
    </div>
  );
}
