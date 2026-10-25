import { describe, expect, it } from 'vitest';
import {
  CLOCK_PRESETS,
  GAME_MINUTES_PER_DAY,
  MINUTES_PER_TICK,
  TICKS_PER_DAY,
  clockPreset,
  minutesPerSecond,
  realMinutesPerDay,
  tickMs,
} from './time';

describe('game clock', () => {
  it('moves the clock in whole five-minute steps', () => {
    expect(MINUTES_PER_TICK).toBe(5);
    expect(GAME_MINUTES_PER_DAY % MINUTES_PER_TICK).toBe(0);
    expect(TICKS_PER_DAY).toBe(GAME_MINUTES_PER_DAY / MINUTES_PER_TICK);
  });

  it('spends 15 real minutes on a day by default', () => {
    expect(realMinutesPerDay('normal')).toBe(15);
    // 288 ticks of ~3.1s each.
    expect(tickMs('normal')).toBeCloseTo((15 * 60_000) / 288, 5);
  });

  it('uses a step long enough to read, short enough to feel alive', () => {
    for (const preset of CLOCK_PRESETS) {
      const step = tickMs(preset.id);
      expect(step, preset.id).toBeGreaterThan(500);
      expect(step).toBeLessThan(10_000);
      expect(realMinutesPerDay(preset.id)).toBe(preset.realMinutesPerDay);
    }
  });

  it('keeps the presets in order, slowest first', () => {
    const days = CLOCK_PRESETS.map((preset) => preset.realMinutesPerDay);
    expect(days).toEqual([...days].sort((a, b) => b - a));
    expect(clockPreset('fast').realMinutesPerDay).toBeLessThan(clockPreset('slow').realMinutesPerDay);
  });

  it('derives how much in-game time passes per real second', () => {
    expect(minutesPerSecond('normal')).toBeCloseTo(GAME_MINUTES_PER_DAY / (15 * 60), 5);
  });
});
