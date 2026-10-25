import { memo } from 'react';
import { motion } from 'framer-motion';
import type { AppMeta } from '@/types';
import { useLongPress } from '@/hooks/useLongPress';
import { cn } from '@/utils/cn';
import { haptic } from '@/utils/haptics';
import { APP_ICON_SIZE, ICON_RADIUS_RATIO, appTileId } from './metrics';

export interface AppIconProps {
  app: AppMeta;
  size?: number;
  /** Draw a shared-layout target so the open/close animation can morph into it. */
  shared?: boolean;
  /** Jiggle + disable the open animation target while arranging icons. */
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
  shared = true,
  editable = false,
  jiggleDelay = 0,
  showLabel = true,
  onOpen,
  onLongPress,
}: AppIconProps) {
  const Icon = app.icon;

  const handlers = useLongPress({
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

  return (
    <div
      className={cn('flex w-[70px] flex-col items-center gap-1.5', editable && 'animate-jiggle')}
      style={editable ? { animationDelay: `${jiggleDelay}ms` } : undefined}
    >
      <motion.button
        type="button"
        aria-label={app.name}
        layoutId={shared ? appTileId(app.id) : undefined}
        whileTap={{ scale: 0.88 }}
        transition={{ type: 'spring', stiffness: 520, damping: 34 }}
        style={{
          width: size,
          height: size,
          borderRadius: size * ICON_RADIUS_RATIO,
        }}
        className="relative flex items-center justify-center overflow-hidden shadow-[0_6px_14px_-4px_rgba(0,0,0,0.5)] ring-1 ring-inset ring-white/15"
        {...handlers}
      >
        <Icon size={size} className="block" aria-hidden />
        <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/25 via-transparent to-black/10" aria-hidden />
      </motion.button>
      {showLabel && (
        <span className="label-shadow max-w-full truncate text-[11px] font-medium leading-tight text-white">
          {app.name}
        </span>
      )}
    </div>
  );
});
