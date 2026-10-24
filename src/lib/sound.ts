import { Howl, Howler } from 'howler';

export type SoundName = 'tap' | 'open' | 'close' | 'notify' | 'error';

interface SoundDef {
  /** `null` until an (original) audio asset is added to /public/sfx. */
  src: string | null;
  volume: number;
}

/**
 * Sound registry. Assets are intentionally not bundled yet — the API exists so
 * the OS can request sounds today and drop in files later without refactors.
 */
const REGISTRY: Record<SoundName, SoundDef> = {
  tap: { src: null, volume: 0.3 },
  open: { src: null, volume: 0.4 },
  close: { src: null, volume: 0.4 },
  notify: { src: null, volume: 0.5 },
  error: { src: null, volume: 0.5 },
};

class SoundManager {
  private enabled = true;
  private readonly cache = new Map<SoundName, Howl>();

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** Global loudness, hooked up to the control centre volume slider. */
  setVolume(value: number): void {
    Howler.volume(Math.min(1, Math.max(0, value)));
  }

  play(name: SoundName): void {
    if (!this.enabled) return;
    const def = REGISTRY[name];
    if (!def.src) return;
    let howl = this.cache.get(name);
    if (!howl) {
      howl = new Howl({ src: [def.src], volume: def.volume, preload: true });
      this.cache.set(name, howl);
    }
    howl.play();
  }

  unload(): void {
    this.cache.forEach((howl) => howl.unload());
    this.cache.clear();
  }
}

export const sound = new SoundManager();
