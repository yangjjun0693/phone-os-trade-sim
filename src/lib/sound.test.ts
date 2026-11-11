import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sound } from './sound';

/** Minimal Web Audio stand-ins so the synth can be exercised under jsdom. */
class FakeGain {
  gain = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
  connect = vi.fn(() => this);
}
class FakeOsc {
  type = '';
  frequency = { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() };
  connect = vi.fn(() => this);
  start = vi.fn();
  stop = vi.fn();
}
class FakeAudioContext {
  state: AudioContextState = 'running';
  currentTime = 0;
  destination = {};
  oscillators: FakeOsc[] = [];
  createOscillator = vi.fn(() => {
    const osc = new FakeOsc();
    this.oscillators.push(osc);
    return osc;
  });
  createGain = vi.fn(() => new FakeGain());
  resume = vi.fn();
  close = vi.fn();
}

let contexts: FakeAudioContext[];
let ctor: ReturnType<typeof vi.fn>;

beforeEach(() => {
  contexts = [];
  ctor = vi.fn(() => {
    const ctx = new FakeAudioContext();
    contexts.push(ctx);
    return ctx;
  });
  (window as unknown as { AudioContext?: unknown }).AudioContext = ctor;
  sound.setEnabled(true);
  sound.setVolume(1);
});

afterEach(() => {
  sound.unload();
  delete (window as unknown as { AudioContext?: unknown }).AudioContext;
  vi.restoreAllMocks();
});

describe('sound', () => {
  it('synthesises a cue when enabled', () => {
    sound.play('open');
    expect(ctor).toHaveBeenCalledTimes(1);
    expect(contexts[0].createOscillator).toHaveBeenCalled();
    const osc = contexts[0].oscillators[0];
    expect(osc.start).toHaveBeenCalled();
    expect(osc.stop).toHaveBeenCalled();
  });

  it('stays silent when muted', () => {
    sound.setEnabled(false);
    sound.play('open');
    expect(ctor).not.toHaveBeenCalled();
  });

  it('stays silent at zero volume', () => {
    sound.setVolume(0);
    sound.play('notify');
    expect(ctor).not.toHaveBeenCalled();
  });

  it('throttles the same cue within 100ms', () => {
    sound.play('tap');
    sound.play('tap');
    const ctx = contexts[0];
    // One cue = one oscillator for `tap`; the second play is swallowed.
    expect(ctx.createOscillator).toHaveBeenCalledTimes(1);
  });

  it('plays two tones for the notify cue', () => {
    sound.play('notify');
    expect(contexts[0].createOscillator).toHaveBeenCalledTimes(2);
  });
});
