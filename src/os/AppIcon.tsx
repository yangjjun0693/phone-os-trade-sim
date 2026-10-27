import { memo } from 'react';
import { motion } from 'framer-motion';
import type { AppMeta } from '@/types';
import { useLongPress } from '@/hooks/useLongPress';
import { useTutorialTargetApp } from '@/hooks/useTutorialTarget';
import { cn } from '@/utils/cn';
import { haptic } from '@/utils/haptics';
import { APP_ICON_SIZE, ICON_RADIUS_RATIO } from './metrics';

export interface AppIconProps {
  app: AppMeta;
  size?: number;
  /** Jiggle while arranging icons. */
  editable?: boolean;
  jiggleDelay?: number;
  /** Dock icons render without a text label, like iOS. */
  showLabel?: boolean;
  onOpen?: () => void;
  onLongPress?: () => void;
}

/**
 * One home-screen icon: a self-contained parody icon tile + label. The artwork
 * is drawn in SVG inside the app; no Apple or third-party brand assets ship.
 */
export const AppIcon = memo(function AppIcon({
  app,
  size = APP_ICON_SIZE,
  editable = false,
  jiggleDelay = 0,
  showLabel = true,
  onOpen,
  onLongPress,
}: AppIconProps) {
  const Icon = app.icon;
  const targetApp = useTutorialTargetApp();
  const highlighted = !editable && targetApp === app.id;

  const longPress = useLongPress({
    delay: 450,
    onLongPress: () => {
      if (editable) return;
      haptic(10);
      onLongPress?.();
    },
    onClick: () => {
      haptic(6);
      onOpen?.();
    },
  });

  // Start the app chunk while the finger is still down. The long-press handler
  // keeps owning pointerdown, so wrap it rather than replacing it.
  const handlers = {
    ...longPress,
    onPointerDown: () => {
      app.preload?.();
      longPress.onPointerDown();
    },
  };

  return (
    <div
      className={cn('flex w-[70px] flex-col items-center gap-1.5', editable && 'animate-jiggle')}
      style={editable ? { animationDelay: `${jiggleDelay}ms` } : undefined}
    >
      <motion.button
        type="button"
        aria-label={app.name}
        whileTap={{ scale: 0.88 }}
        transition={{ type: 'spring', stiffness: 520, damping: 34 }}
        onPointerEnter={() => app.preload?.()}
        onFocus={() => app.preload?.()}
        style={{
          width: size,
          height: size,
          borderRadius: size * ICON_RADIUS_RATIO,
        }}
        className="relative flex items-center justify-center overflow-hidden shadow-[0_8px_18px_-6px_rgba(0,0,0,0.55)] ring-1 ring-inset ring-white/25 dark:ring-white/20"
        {...handlers}
      >
        <Icon size={size} className="block" aria-hidden />
        <span
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/30 via-transparent to-black/10"
          aria-hidden
        />
        {highlighted ? (
          <motion.span
            aria-hidden
            data-tutorial-highlight
            className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[0_0_0_2px_rgb(var(--ios-accent))] ring-2 ring-inset ring-white"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
          />
        ) : null}
      </motion.button>
      {showLabel && (
        <span className="wallpaper-ink max-w-full truncate text-[11px] font-semibold leading-tight">
          {app.name}
        </span>
      )}
    </div>
  );
});
