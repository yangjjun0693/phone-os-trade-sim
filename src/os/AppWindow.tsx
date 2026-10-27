import { motion, useIsPresent } from 'framer-motion';
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
 *
 * While a window animates out it stays in the DOM for ~180 ms, stacked above
 * whatever replaced it. `useIsPresent` lets us make that outgoing copy inert the
 * instant it starts leaving, so it can never sit invisibly on top of the next
 * app and eat every tap (the "app opens but nothing responds" bug).
 */
export function AppWindow({ appId }: { appId: string }) {
  const app = getApp(appId);
  // Hooks must run before the early return below.
  const isPresent = useIsPresent();
  if (!app) return null;

  const Component = app.Component;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: 8, transition: { duration: 0.18, ease: EASE_IOS } }}
      transition={SPRING_SOFT}
      aria-hidden={!isPresent}
      data-app-window={app.id}
      style={
        {
          backgroundColor: app.gradient[1],
          // Every app paints itself with its own accent.
          '--app-accent': hexToRgbTriplet(app.accent),
          ...(isPresent ? null : { pointerEvents: 'none' as const }),
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
