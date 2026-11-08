import type { GameEvent } from '@/game/notifications';

type GameEventListener = (event: GameEvent) => void;

const listeners = new Set<GameEventListener>();

/**
 * Publish a domain event to every current subscriber. Iterates a copy so a
 * listener that unsubscribes (or subscribes) mid-dispatch can't corrupt the
 * walk.
 */
export function emitGameEvent(event: GameEvent): void {
  for (const listener of [...listeners]) listener(event);
}

/** Subscribe to domain events; call the returned function to unsubscribe. */
export function onGameEvent(listener: GameEventListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
