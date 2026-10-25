import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  createTab,
  extractTitle,
  marketIdFromUrl,
  type BrowserTab,
} from './browserData';

interface UseBrowserOptions {
  initialUrl: string;
  appId: string;
  /** Return false to skip recording a visit (used by Shade's ~10% rule). */
  shouldRecord?: (tab: BrowserTab) => boolean;
  /** Loading speed multiplier; Shade's circuit is slower. */
  speedMs?: number;
}

/**
 * All the shared browser plumbing: a tab list, a per-tab history stack and the
 * simulated page load. The three chrome shells (Chrome / Safari / Tor) only
 * render this state in their own house style.
 */
export function useBrowser({
  initialUrl,
  appId,
  shouldRecord,
  speedMs = 90,
}: UseBrowserOptions) {
  const [tabs, setTabs] = useState<BrowserTab[]>(() => {
    const first = createTab(initialUrl);
    return [{ ...first, loading: false, progress: 1 }];
  });
  const [activeId, setActiveId] = useState(() => tabs[0].id);
  const [address, setAddress] = useState(initialUrl);
  const [stack, setStack] = useState<string[]>([initialUrl]);
  const [index, setIndex] = useState(0);

  const timers = useRef<number[]>([]);
  const addBrowserHistory = useGameStore((s) => s.addBrowserHistory);

  useEffect(
    () => () => {
      timers.current.forEach((id) => window.clearInterval(id));
      timers.current = [];
    },
    [],
  );

  const activeTab = tabs.find((tab) => tab.id === activeId) ?? null;
  const canGoBack = index > 0;
  const canGoForward = index < stack.length - 1;

  /** Kick off a fake load for one tab. */
  const load = useCallback(
    (tabId: string, url: string) => {
      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === tabId
            ? {
                ...tab,
                url,
                title: '로딩 중…',
                loading: true,
                progress: 0,
                marketId: marketIdFromUrl(url),
              }
            : tab,
        ),
      );

      let progress = 0;
      const timer = window.setInterval(() => {
        progress += Math.random() * 22 + 12;
        if (progress >= 100) {
          window.clearInterval(timer);
          setTabs((prev) =>
            prev.map((tab) =>
              tab.id === tabId
                ? {
                    ...tab,
                    loading: false,
                    progress: 1,
                    title: extractTitle(url),
                    marketId: marketIdFromUrl(url),
                  }
                : tab,
            ),
          );
        } else {
          setTabs((prev) =>
            prev.map((tab) => (tab.id === tabId ? { ...tab, progress: progress / 100 } : tab)),
          );
        }
      }, speedMs);
      timers.current.push(timer);
    },
    [speedMs],
  );

  const navigate = useCallback(
    (url: string) => {
      setAddress(url);
      load(activeId, url);
      setStack((prev) => {
        const next = [...prev.slice(0, index + 1), url];
        return next;
      });
      setIndex((current) => current + 1);
    },
    [activeId, index, load],
  );

  const goBack = useCallback(() => {
    if (index <= 0) return;
    const next = index - 1;
    const url = stack[next];
    setIndex(next);
    setAddress(url);
    load(activeId, url);
  }, [activeId, index, load, stack]);

  const goForward = useCallback(() => {
    if (index >= stack.length - 1) return;
    const next = index + 1;
    const url = stack[next];
    setIndex(next);
    setAddress(url);
    load(activeId, url);
  }, [activeId, index, load, stack]);

  const openTab = useCallback(
    (url = 'hxxp://') => {
      const tab = createTab(url);
      setTabs((prev) => [...prev, tab]);
      setActiveId(tab.id);
      setAddress(tab.url);
      setStack([url]);
      setIndex(0);
    },
    [],
  );

  const closeTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        const next = prev.filter((tab) => tab.id !== id);
        if (next.length === 0) {
          const fresh = createTab();
          setActiveId(fresh.id);
          setAddress(fresh.url);
          return [fresh];
        }
        if (id === activeId) {
          const fallback = next[next.length - 1];
          setActiveId(fallback.id);
          setAddress(fallback.url);
        }
        return next;
      });
    },
    [activeId],
  );

  const selectTab = useCallback(
    (id: string) => {
      const tab = tabs.find((entry) => entry.id === id);
      setActiveId(id);
      if (tab) setAddress(tab.url);
      setStack([tab?.url ?? 'hxxp://']);
      setIndex(0);
    },
    [tabs],
  );

  // Record a visit once a real page settles.
  useEffect(() => {
    if (!activeTab || activeTab.loading) return;
    const url = activeTab.url.trim();
    if (!url.startsWith('hxxp') || url.replace(/\/+$/, '') === 'hxxp:') return;
    if (shouldRecord && !shouldRecord(activeTab)) return;
    addBrowserHistory({ appId, url: activeTab.url, title: activeTab.title });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab?.url, activeTab?.loading, activeTab?.title, appId, addBrowserHistory]);

  return {
    tabs,
    activeTab,
    activeId,
    address,
    setAddress,
    navigate,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    openTab,
    closeTab,
    selectTab,
  };
}
