/**
 * OS sounds — synthesised with the Web Audio API.
 *
 * No audio files ship (Phase 8 / §9): every cue is an oscillator plus a short
 * gain envelope, so there is nothing to download and nothing to license. The
 * API is unchanged from the old Howler stub — callers still only need
 * `sound.play(name)` — and it is a safe no-op wherever there is no AudioContext
 * (SSR, jsdom, or a browser that blocks it).
 */

export type SoundName = 'tap' | 'open' | 'close' | 'notify' | 'error';

interface Tone {
  /** Frequency in Hz. */
  freq: number;
  type: OscillatorType;
  /** Seconds. */
  duration: number;
  /** Peak gain before the master volume, 0..1. */
  gain: number;
  /** Optional glide target in Hz. */
  sweepTo?: number;
  /** Offset from the cue's start, in seconds (lets a cue be a little phrase). */
  delay?: number;
}

/**
 * One short, tasteful cue per event. Kept deliberately quiet and closely
 * voiced — this is UI chrome, not a soundtrack.
 */
const TONES: Record<SoundName, Tone[]> = {
  tap: [{ freq: 660, type: 'triangle', duration: 0.05, gain: 0.22 }],
  open: [{ freq: 420, type: 'sine', duration: 0.16, gain: 0.28, sweepTo: 740 }],
  close: [{ freq: 620, type: 'sine', duration: 0.14, gain: 0.26, sweepTo: 320 }],
  notify: [
    { freq: 880, type: 'sine', duration: 0.12, gain: 0.32 },
    { freq: 1180, type: 'sine', duration: 0.16, gain: 0.28, delay: 0.11 },
  ],
  error: [{ freq: 210, type: 'square', duration: 0.18, gain: 0.24, sweepTo: 140 }],
};

/** No more than one instance of the same cue inside this window (§9). */
const THROTTLE_MS = 100;

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

class SoundManager {
  private enabled = true;
  private volume = 1;
  private ctx: AudioContext | null = null;
  private readonly lastPlayed = new Map<SoundName, number>();

  /** Mute switch (the onboarding / settings sound consent). */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** Master volume, hooked to the control-centre volume slider. */
  setVolume(value: number): void {
    this.volume = clamp01(value);
  }

  private context(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!this.ctx) {
      try {
        this.ctx = new Ctor();
      } catch {
        return null;
      }
    }
    return this.ctx;
  }

  play(name: SoundName): void {
    if (!this.enabled || this.volume <= 0) return;

    const now = Date.now();
    if (now - (this.lastPlayed.get(name) ?? 0) < THROTTLE_MS) return;
    this.lastPlayed.set(name, now);

    const ctx = this.context();
    if (!ctx) return;
    // Autoplay policies suspend the context until a user gesture; resume it.
    if (ctx.state === 'suspended') void ctx.resume();

    const start = ctx.currentTime;
    for (const tone of TONES[name]) {
      const at = start + (tone.delay ?? 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = tone.type;
      osc.frequency.setValueAtTime(tone.freq, at);
      if (tone.sweepTo) osc.frequency.linearRampToValueAtTime(tone.sweepTo, at + tone.duration);

      const peak = Math.max(0.0001, tone.gain * this.volume);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(peak, at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + tone.duration);

      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + tone.duration + 0.02);
    }
  }

  unload(): void {
    try {
      void this.ctx?.close();
    } catch {
      /* ignore */
    }
    this.ctx = null;
    this.lastPlayed.clear();
  }
}

export const sound = new SoundManager();
