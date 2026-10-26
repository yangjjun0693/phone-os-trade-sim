import { motion } from 'framer-motion';
import { getApp } from '@/apps/registry';
import { hexToRgbTriplet } from '@/utils/color';
import { EASE_IOS, SPRING_SOFT } from '@/utils/motion';

/**
 * The single full-screen app surface.
 *
 * NOTE: this deliberately does NOT use a shared `layoutId` with the home icon.
 * A shared-layout morph between the icon and the window can be interrupted when
 * the player opens another app mid-animation, which used to leave a stale window
 * mounted (the previous app reappearing with no way home). A self-contained
 * zoom + fade looks the same and always unmounts.
 */
export function AppWindow({ appId }: { appId: string }) {
  const app = getApp(appId);
  if (!app) return null;

  const Component = app.Component;

  return (
    <motion.div
      key={app.id}
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: 8, transition: { duration: 0.18, ease: EASE_IOS } }}
      transition={SPRING_SOFT}
      style={
        {
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
        transition={{ duration: 0.16, delay: 0.03 }}
        className="h-full w-full bg-ios-bg"
      >
        <Component />
      </motion.div>
    </motion.div>
  );
}
