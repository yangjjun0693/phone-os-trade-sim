import { cn } from '@/utils/cn';

/**
 * Shared wallpaper stack: a gradient mesh, a soft light wash and a fine grain.
 *
 * CSS-only on purpose — no bitmap to download and no animation loop, so the
 * home screen can paint it once and never touch it again. The negative z-index
 * keeps it behind in-flow content inside the parent's stacking context.
 */
export function Wallpaper({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)}
    >
      <div className="absolute inset-0 os-wallpaper" />
      <div className="absolute inset-0 wallpaper-glow" />
      <div className="absolute inset-0 wallpaper-grain" />
    </div>
  );
}
