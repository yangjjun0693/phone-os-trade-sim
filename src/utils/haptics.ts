/** Minimal shape so we do not intersect with the (incomplete) DOM lib type. */
interface Vibrator {
  vibrate?: (pattern: number | number[]) => boolean;
}

/**
 * Best-effort haptics. Browsers expose `navigator.vibrate` unevenly and iOS
 * Safari ignores it, so this is a no-op there by design.
 */
export function haptic(pattern: number | number[] = 8): void {
  if (typeof navigator === 'undefined') return;
  const vibrator = navigator as unknown as Vibrator;
  if (typeof vibrator.vibrate !== 'function') return;
  try {
    vibrator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}
