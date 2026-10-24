import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { clues, markets } from '@/data';
import { describeStatus, suspicionScore } from '@/game';
import { useGameStore } from '@/store/gameStore';
import { BrowserTabs, type BrowserTabsProps, type Tab, type CircuitState } from './BrowserTabs';
import { prefersReducedMotion } from '@/utils/motion';

const INITIAL_TABS: Tab[] = [
  { id: 'tab-1', url: 'hxxp://nightbazaar.onion', title: 'NightBazaar', loading: false, progress: 1, marketId: 'market-nightbazaar' },
];

// Circuit nodes for animation
const CIRCUIT_NODES = [
  { x: 10, y: 10 }, { x: 50, y: 15 }, { x: 90, y: 10 },
  { x: 15, y: 50 }, { x: 50, y: 50 }, { x: 85, y: 50 },
  { x: 10, y: 90 }, { x: 50, y: 85 }, { x: 90, y: 90 },
];

const CIRCUIT_EDGES = [
  [0, 1], [1, 2], [0, 3], [1, 4], [2, 5],
  [3, 4], [4, 5], [3, 6], [4, 7], [5, 8],
  [6, 7], [7, 8],
];

export function ShadeApp() {
  const [tabs, setTabs] = useState<Tab[]>(INITIAL_TABS);
  const [activeTabId, setActiveTabId] = useState<string>(INITIAL_TABS[0].id);
  const [addressValue, setAddressValue] = useState('hxxp://nightbazaar.onion');
  const [history, setHistory] = useState<string[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [circuit, setCircuit] = useState<CircuitState>({
    stage: 'idle',
    activeNodes: [],
    activeEdges: [],
    message: '회로 대기 중...',
  });
  const [connected, setConnected] = useState(false);
  const circuitRef = useRef<number>(0);
  const gameDateTime = useGameStore(s => s.gameDateTime);
  const addBrowserHistory = useGameStore(s => s.addBrowserHistory);

  const activeTab = tabs.find(t => t.id === activeTabId);
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history[0].length - 1;
  const reduced = prefersReducedMotion();

  // Circuit animation loop
  useEffect(() => {
    if (reduced) return;

    const stages: CircuitState['stage'][] = ['connecting', 'connected', 'unstable', 'connected', 'unstable', 'disconnected'];
    let stageIndex = 0;

    const runCircuit = () => {
      const stage = stages[stageIndex % stages.length];
      const isConnecting = stage === 'connecting';
      const isConnected = stage === 'connected';
      const isUnstable = stage === 'unstable';
      const isDisconnected = stage === 'disconnected';

      let activeNodes: number[] = [];
      let activeEdges: number[][] = [];
      let message = '';

      if (isConnecting) {
        const progress = Math.floor((Date.now() / 300) % (CIRCUIT_NODES.length + 1));
        activeNodes = CIRCUIT_NODES.slice(0, progress).map((_, i) => i);
        activeEdges = CIRCUIT_EDGES.slice(0, Math.max(0, progress - 1));
        message = '회로 연결 중...';
      } else if (isConnected) {
        activeNodes = CIRCUIT_NODES.map((_, i) => i);
        activeEdges = CIRCUIT_EDGES;
        message = '익명 회로 연결됨';
        setConnected(true);
      } else if (isUnstable) {
        activeNodes = CIRCUIT_NODES
          .map((_, i) => (Math.random() > 0.3 ? i : -1))
          .filter(n => n >= 0);
        activeEdges = CIRCUIT_EDGES.filter(() => Math.random() > 0.4);
        message = Math.random() > 0.5 ? '회로 불안정...' : '트래픽 분석 저항 중...';
      } else if (isDisconnected) {
        activeNodes = [];
        activeEdges = [];
        message = '연결 끊김. 재연결 시도 중...';
        setConnected(false);
      }

      setCircuit({ stage, activeNodes, activeEdges, message });
      stageIndex++;
    };

    runCircuit();
    const interval = setInterval(runCircuit, 4000);

    return () => clearInterval(interval);
  }, [reduced]);

  // Only record history for Shade when actually connected (minimal logging ~10%)
  useEffect(() => {
    if (activeTab && !activeTab.loading && activeTab.url.startsWith('hxxp') && connected && Math.random() < 0.1) {
      addBrowserHistory({
        appId: 'shade',
        url: activeTab.url,
        title: activeTab.title,
      });
    }
  }, [activeTab?.url, activeTab?.loading, activeTab?.title, connected, addBrowserHistory, gameDateTime]);

  const navigate = useCallback((url: string) => {
    if (!connected) {
      setCircuit(prev => ({ ...prev, message: '회로 미연결. 대기 중...', stage: 'disconnected' }));
      return;
    }

    setTabs(prev => prev.map(t =>
      t.id === activeTabId ? { ...t, url, title: '회로 경유 중...', loading: true, progress: 0 } : t
    ));
    setAddressValue(url);

    // Shade loads slower with variable speed
    let progress = 0;
    const baseSpeed = 150 + Math.random() * 200;
    const interval = setInterval(() => {
      const increment = Math.random() * 15 + 5;
      progress += increment;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTabs(prev => prev.map(t =>
          t.id === activeTabId
            ? { ...t, loading: false, progress: 1, title: extractTitle(url) }
            : t
        ));
      } else {
        // Random stalls
        if (Math.random() < 0.05) {
          // Brief stall
        }
        setTabs(prev => prev.map(t =>
          t.id === activeTabId ? { ...t, progress: progress / 100 } : t
        ));
      }
    }, baseSpeed);

    setHistory(prev => {
      const newHistory = prev[0].slice(0, historyIndex + 1);
      newHistory.push(url);
      return [newHistory];
    });
    setHistoryIndex(h => h + 1);
  }, [activeTabId, historyIndex, connected]);

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

  // Custom start page for Shade
  const renderStartPage = useCallback((browserAppId: string) => (
    <ShadeStartPage browserAppId={browserAppId} circuit={circuit} connected={connected} />
  ), [circuit, connected]);

  // Custom tab content for Shade
  const renderTabContent = useCallback((tab: Tab, browserAppId: string) => (
    <ShadeTabContent tab={tab} browserAppId={browserAppId} connected={connected} />
  ), [connected]);

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
      appId="shade"
      circuit={circuit}
      connected={connected}
      renderTabContent={renderTabContent}
      renderStartPage={renderStartPage}
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

// Shade-specific start page
function ShadeStartPage({
  browserAppId,
  circuit,
  connected,
}: {
  browserAppId: string;
  circuit: CircuitState;
  connected: boolean;
}) {
  const reduced = prefersReducedMotion();

  return (
    <div className="flex-1 flex flex-col">
      <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl bg-ios-surface px-3 py-2 ring-1 ring-black/5 dark:ring-white/5">
        <span className="text-[14px] text-ios-muted">Shade · 익명 브라우저</span>
      </div>

      <div className="mx-4 mb-6 rounded-2xl bg-ios-surface p-4 ring-1 ring-black/5 dark:ring-white/5">
        <h3 className="text-[15px] font-semibold">회로 상태</h3>
        <div className="mt-3 flex items-center gap-2 text-[13px]">
          <div
            className={`size-2.5 rounded-full ${connected ? 'bg-ios-green animate-pulse' : 'bg-ios-red'}`}
          />
          <span className="text-ios-muted">{circuit.message}</span>
        </div>
        <p className="mt-2 text-[12px] text-ios-muted">
          Shade는 트래픽을 다중 홉 회로로 경유시킵니다. 연결이 불안정할 수 있으며,
          방문 기록은 거의 남기지 않습니다.
        </p>
      </div>

      <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl bg-ios-surface px-3 py-2 ring-1 ring-black/5 dark:ring-white/5">
        <span className="text-[14px] text-ios-muted">알려진 .onion 주소 직접 입력</span>
      </div>

      <div className="mx-4 grid gap-2">
        {['hxxp://nightbazaar.onion', 'hxxp://quickdrop.onion', 'hxxp://clearnet-mirror.onion', 'hxxp://lastcall.onion'].map((url) => (
          <button
            key={url}
            type="button"
            className="text-left p-3 rounded-xl bg-ios-surface ring-1 ring-black/5 dark:ring-white/5 hover:ring-ios-accent/30 transition-colors"
            onClick={() => {
              // Navigation handled by parent
            }}
          >
            <p className="text-[14px] font-mono text-ios-accent">{url}</p>
            <p className="text-[12px] text-ios-muted">클릭하여 접속 (회로 필요)</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// Shade-specific tab content
function ShadeTabContent({
  tab,
  browserAppId,
  connected,
}: {
  tab: Tab;
  browserAppId: string;
  connected: boolean;
}) {
  const market = tab.marketId ? markets.find((m: any) => m.id === tab.marketId) : null;

  if (!connected) {
    return (
      <div className="p-4 text-center">
        <div className="mx-auto mb-4 size-16 rounded-full bg-ios-red/10 flex items-center justify-center">
          <span className="text-ios-red text-4xl">⚠</span>
        </div>
        <h3 className="text-[18px] font-semibold">회로 미연결</h3>
        <p className="mt-2 text-ios-muted">익명 회로가 연결될 때까지 기다려주세요.</p>
        <p className="mt-1 text-[13px] text-ios-muted">자동으로 재연결을 시도합니다.</p>
      </div>
    );
  }

  if (market) {
    const score = suspicionScore(market, clues);
    return (
      <div className="p-4">
        <div className="glass sticky top-0 mb-4 flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-black/5">
          <span className="truncate text-[13px] text-ios-muted">{tab.url}</span>
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-ios-green/10 text-ios-green">
            익명
          </span>
        </div>

        <h2 className="text-[22px] font-bold">{market.name}</h2>
        <p className="mt-1 text-[13px] text-ios-muted">{market.tagline}</p>

        <div className="mt-4 rounded-2xl bg-ios-surface p-4 ring-1 ring-black/5 dark:ring-white/5">
          <p className="text-[12px] font-medium text-ios-muted">단서 (일부는 노이즈입니다)</p>
          <ul className="mt-2 space-y-1.5">
            {market.traits.map((trait: string) => (
              <li key={trait} className="text-[14px]">• {trait}</li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-ios-muted">
            참고 지표: 의심도 {score}/100 · {describeStatus(market.status)}
          </p>
        </div>

        <button
          type="button"
          disabled
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ios-separator/20 text-[16px] font-semibold text-ios-muted"
        >
          거래 시스템은 아직 연결되지 않았습니다
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="glass sticky top-0 mb-4 flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-black/5">
        <span className="truncate text-[13px] text-ios-muted">{tab.url}</span>
        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-ios-green/10 text-ios-green">
          익명
        </span>
      </div>
      <h2 className="text-[22px] font-bold">{tab.title}</h2>
      <p className="mt-4 text-[14px] text-ios-muted">이 사이트는 게임 내 허구 콘텐츠입니다.</p>
    </div>
  );
}