import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Apps are lazy-loaded chunks now, so a `findBy*` can legitimately take longer
// than the 1 s default when the whole suite runs in parallel on a busy machine.
configure({ asyncUtilTimeout: 4000 });

// jsdom does not implement these; the OS shell calls them defensively.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

if (!window.HTMLElement.prototype.scrollTo) {
  window.HTMLElement.prototype.scrollTo = vi.fn();
}

// jsdom throws "Not implemented" for window.scrollTo; Framer Motion calls it
// while measuring layout animations.
window.scrollTo = vi.fn();

// Framer Motion's layout projection needs these observers; jsdom lacks both.
if (!('ResizeObserver' in globalThis)) {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;
}

if (!('IntersectionObserver' in globalThis)) {
  class IntersectionObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): [] {
      return [];
    }
  }
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    IntersectionObserverStub;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});
