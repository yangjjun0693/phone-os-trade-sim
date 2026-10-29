import { useOSStore } from '@/store/osStore';
import { cn } from '@/utils/cn';

/**
 * The 140×5 capsule at the bottom of every modern iPhone — and, here, a real
 * escape hatch: tapping it always closes an open overlay or returns home, so a
 * player can never be stranded inside an app.
 *
 * It has two looks (see `.home-indicator*` in `styles/globals.css`):
 *  - over an open app it inverts whatever the app painted there, because the
 *    bottom edge can be any colour under any theme;
 *  - on the OS' own surfaces it uses the theme ink, which is a neutral black or
 *    white instead of the tinted result of inverting a pastel wallpaper.
 *
 * Layout rule for the blend: the capsule is a **direct child of the OS box**.
 * A wrapper with a `transform` or `z-index` would stack in between, become the
 * blend backdrop, and leave `difference` with nothing to invert — the capsule
 * would render plain white and vanish on light screens. So it centres with
 * `mx-auto` (no `-translate-x-1/2`), carries its own `z-50`, is never animated,
 * and gets a separate transparent button as its hit target.
 */
export function HomeIndicator({ light = false }: { light?: boolean }) {
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

  const blend = Boolean(openAppId) && overlay === 'none';

  return (
    <>
      <span
        data-home-indicator
        data-light={light ? '' : undefined}
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-2 z-50 mx-auto block h-[5px] w-[140px] rounded-full',
          blend ? 'home-indicator' : 'home-indicator-ink',
        )}
      />
      <button
        type="button"
        aria-label="홈으로"
        onClick={escape}
        className="absolute inset-x-0 bottom-0 z-50 mx-auto h-6 w-[180px]"
      />
    </>
  );
}
