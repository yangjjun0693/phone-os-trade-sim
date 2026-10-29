import { getApp } from '@/apps/registry';
import type { OverlayKind } from '@/types';

/**
 * Which ink the status bar must use for the layer that is currently on top.
 *
 * (The home indicator does not need this: it blends with whatever it sits on.
 * The status bar is text, so it has to be told.)
 *
 * Almost every surface follows the theme through `--os-chrome`: near-black ink
 * on the light wallpaper, white on the dark one. Two surfaces never do, and
 * dark theme ink disappears on both:
 *
 *  - the app switcher's veil (`bg-black/75`), and
 *  - apps that are dark in every theme (`AppMeta.alwaysDark`, e.g. the casino
 *    and the dark-net browser) while the OS itself is in light mode.
 *
 * A pull-down overlay (notification/control centre) veils the screen with the
 * theme's own surface, so the theme ink is correct there and wins over the app
 * underneath — hence the `overlay === 'none'` guard.
 */
export function chromeInverted(overlay: OverlayKind, openAppId: string | null): boolean {
  if (overlay === 'appSwitcher') return true;
  if (overlay !== 'none' || !openAppId) return false;
  return getApp(openAppId)?.alwaysDark === true;
}
