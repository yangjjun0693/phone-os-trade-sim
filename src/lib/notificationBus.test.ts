import { describe, expect, it, vi } from 'vitest';
import { emitGameEvent, onGameEvent } from './notificationBus';

describe('notificationBus', () => {
  it('delivers to subscribers and stops after unsubscribe', () => {
    const spy = vi.fn();
    const off = onGameEvent(spy);
    emitGameEvent({ type: 'bank.deposit', at: 'x', amount: 1, large: false, flagged: true });
    expect(spy).toHaveBeenCalledTimes(1);
    off();
    emitGameEvent({ type: 'bank.deposit', at: 'x', amount: 1, large: false, flagged: true });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
