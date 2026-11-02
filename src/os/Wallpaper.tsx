import { cn } from '@/utils/cn';

/**
 * Shared wallpaper stack: a single theme-dependent image.
 *
 * The image URL lives in the `--os-wallpaper` token (light / dark variants in
 * `styles/tokens.css`), so swapping art is a one-line token change. The
 * negative z-index keeps it behind in-flow content inside the parent's
 * stacking context.
 */
export function Wallpaper({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)}
    >
      <div className="absolute inset-0 os-wallpaper" />
    </div>
  );
}
