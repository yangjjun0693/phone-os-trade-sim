import { useState, useCallback, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { BrowserTabs, type Tab } from './BrowserTabs';

const INITIAL_TABS: Tab[] = [
  { id: 'tab-1', url: 'hxxp://nightbazaar.onion', title: 'NightBazaar', loading: false, progress: 1, marketId: 'market-nightbazaar' },
];

export function SailorApp() {
  const [tabs, setTabs] = useState<Tab[]>(INITIAL_TABS);
  const [activeTabId, setActiveTabId] = useState<string>(INITIAL_TABS[0].id);
  const [addressValue, setAddressValue] = useState('hxxp://nightbazaar.onion');
  const [history, setHistory] = useState<string[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const gameDateTime = useGameStore(s => s.gameDateTime);
  const addBrowserHistory = useGameStore(s => s.addBrowserHistory);

  const activeTab = tabs.find(t => t.id === activeTabId);
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history[0].length - 1;

  const navigate = useCallback((url: string) => {
    setTabs(prev => prev.map(t =>
      t.id === activeTabId ? { ...t, url, title: '로딩 중...', loading: true, progress: 0 } : t
    ));
    setAddressValue(url);

    // Sailor loads faster - simpler loading
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30 + 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTabs(prev => prev.map(t =>
          t.id === activeTabId
            ? { ...t, loading: false, progress: 1, title: extractTitle(url) }
            : t
        ));
      } else {
        setTabs(prev => prev.map(t =>
          t.id === activeTabId ? { ...t, progress: progress / 100 } : t
        ));
      }
    }, 120);

    setHistory(prev => {
      const newHistory = prev[0].slice(0, historyIndex + 1);
      newHistory.push(url);
      return [newHistory];
    });
    setHistoryIndex(h => h + 1);
  }, [activeTabId, historyIndex]);

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const url = history[0][newIndex];
      setHistoryIndex(newIndex);
      navigate(url);
    }
  }, [historyIndex, history, navigate]);

  const goForward = useCallback(() => {
    if (historyIndex < history[0].length - 1) {
      const newIndex = historyIndex + 1;
      const url = history[0][newIndex];
      setHistoryIndex(newIndex);
      navigate(url);
    }
  }, [historyIndex, history, navigate]);

  const handleTabClick = useCallback((id: string) => {
    setActiveTabId(id);
    const tab = tabs.find(t => t.id === id);
    if (tab) setAddressValue(tab.url);
  }, [tabs]);

  const handleTabClose = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== id);
      if (filtered.length === 0) {
        const newTab = createNewTab();
        return [newTab];
      }
      if (activeTabId === id) {
        setActiveTabId(filtered[filtered.length - 1].id);
      }
      return filtered;
    });
  }, [activeTabId]);

  const handleNewTab = useCallback(() => {
    const newTab = createNewTab();
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  const handleAddressChange = useCallback((value: string) => {
    setAddressValue(value);
  }, []);

  const handleAddressSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    navigate(addressValue);
  }, [addressValue, navigate]);

  useEffect(() => {
    if (activeTab) {
      setAddressValue(activeTab.url);
    }
  }, [activeTab]);

  return (
    <BrowserTabs
      tabs={tabs}
      activeTabId={activeTabId}
      onTabClick={handleTabClick}
      onTabClose={handleTabClose}
      onNewTab={handleNewTab}
      onNavigate={navigate}
      addressValue={addressValue}
      onAddressChange={handleAddressChange}
      onAddressSubmit={handleAddressSubmit}
      canGoBack={canGoBack}
      canGoForward={canGoForward}
      onBack={goBack}
      onForward={goForward}
      appId="sailor"
    />
  );
}

function createNewTab(): Tab {
  return {
    id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    url: 'hxxp://',
    title: '새 탭',
    loading: false,
    progress: 0,
  };
}

function extractTitle(url: string): string {
  try {
    const hostname = new URL(url.replace('hxxp://', 'http://')).hostname;
    return hostname.replace('.onion', '').replace(/^www\./, '');
  } catch {
    return url;
  }
}