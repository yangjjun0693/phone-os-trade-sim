import { motion } from 'framer-motion';
import { getApp } from '@/apps/registry';
import { hexToRgbTriplet } from '@/utils/color';
import { SPRING_SNAPPY } from '@/utils/motion';
import { appTileId } from './metrics';

/**
 * The single full-screen app surface.
 *
 * Shares a `layoutId` with the home-screen icon so opening/closing morphs the
 * icon tile into the window (and back). The app content is layered on top and
 * fades in, mimicking iOS's expanding snapshot.
 */
export function AppWindow({ appId }: { appId: string }) {
  const app = getApp(appId);
  if (!app) return null;

  const Component = app.Component;

  return (
    <motion.div
      layoutId={appTileId(app.id)}
      transition={SPRING_SNAPPY}
      style={
        {
          borderRadius: 0,
          backgroundColor: app.gradient[1],
          // Every app paints itself with its own accent.
          '--app-accent': hexToRgbTriplet(app.accent),
        } as React.CSSProperties
      }
      className="absolute inset-0 z-30 overflow-hidden will-change-transform"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18, delay: 0.04 }}
        className="h-full w-full bg-ios-bg"
      >
        <Component />
      </motion.div>
    </motion.div>
  );
}
