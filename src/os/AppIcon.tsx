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
  onOpen?: () => void;
  onLongPress?: () => void;
}

/**
 * One home-screen icon: gradient squircle tile + label. The glyph is drawn from
 * a lucide icon, never an Apple asset.
 */
export const AppIcon = memo(function AppIcon({
  app,
  size = APP_ICON_SIZE,
  shared = true,
  editable = false,
  jiggleDelay = 0,
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
          background: `linear-gradient(160deg, ${app.gradient[0]}, ${app.gradient[1]})`,
        }}
        className="relative flex items-center justify-center shadow-[0_6px_14px_-4px_rgba(0,0,0,0.5)] ring-1 ring-inset ring-white/15"
        {...handlers}
      >
        <Icon
          className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
          style={{ width: size * 0.52, height: size * 0.52 }}
          strokeWidth={1.9}
          aria-hidden
        />
      </motion.button>
      <span className="label-shadow max-w-full truncate text-[11px] font-medium leading-tight text-white">
        {app.name}
      </span>
    </div>
  );
});
