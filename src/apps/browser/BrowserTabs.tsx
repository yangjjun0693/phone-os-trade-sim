import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronLeft, ChevronRight, Search, Loader2 } from 'lucide-react';
import { clues, markets } from '@/data';
import { describeStatus, suspicionScore } from '@/game';
import { useGameStore } from '@/store/gameStore';
import { AppShell } from '../AppShell';
import { Row, Section } from '../SectionList';
import { SPRING_SNAPPY, SPRING_SOFT, prefersReducedMotion } from '@/utils/motion';
import { cn } from '@/utils/cn';

export interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  loading: boolean;
  progress: number;
  marketId?: string;
}

export interface CircuitState {
  stage: 'idle' | 'connecting' | 'connected' | 'unstable' | 'disconnected';
  activeNodes: number[];
  activeEdges: number[][];
  message: string;
}

const MOCK_SITES = [
  { url: 'hxxp://nightbazaar.onion', title: 'NightBazaar', marketId: 'market-nightbazaar' },
  { url: 'hxxp://quickdrop.onion', title: 'QuickDrop', marketId: 'market-quickdrop' },
  { url: 'hxxp://clearnet-mirror.onion', title: 'ClearNet-Mirror', marketId: 'market-clearnet' },
  { url: 'hxxp://lastcall.onion', title: 'LastCall', marketId: 'market-lastcall' },
  { url: 'hxxp://shadowgoods.onion', title: 'ShadowGoods', marketId: null },
  { url: 'hxxp://darkweb-mall.onion', title: 'DarkWeb Mall', marketId: null },
];

function TabItem({ tab, active, onClick, onClose, index }: {
  tab: Tab;
  active: boolean;
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
  index: number;
}) {
  const reduced = prefersReducedMotion();

  return (
    <motion.div
      layout
      initial={reduced ? undefined : { opacity: 0, x: -20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={reduced ? undefined : { opacity: 0, x: 20, scale: 0.9 }}
      transition={SPRING_SNAPPY}
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors',
        active ? 'bg-ios-surface ring-1 ring-ios-accent/30' : 'hover:bg-ios-separator/15'
      )}
      style={{ minWidth: 140, maxWidth: 200 }}
    >
      <div className="truncate flex-1 flex items-center gap-1.5 text-[13px]">
        {tab.loading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ display: reduced ? 'none' : 'block' }}
          >
            <Loader2 className="size-3.5 text-ios-accent" />
          </motion.div>
        ) : (
          <Search className="size-3.5 text-ios-muted" />
        )}
        <span className="truncate">{tab.title}</span>
      </div>
      <AnimatePresence>
        {active && tab.loading && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: tab.progress, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute bottom-0 left-0 h-0.5 bg-ios-accent rounded-full"
            style={{ width: '100%' }}
          />
        )}
      </AnimatePresence>
      <button
        onClick={onClose}
        className="p-0.5 rounded text-ios-muted hover:text-ios-text hover:bg-ios-separator/20"
        aria-label="탭 닫기"
      >
        <X className="size-3.5" />
      </button>
    </motion.div>
  );
}

export interface BrowserTabsProps {
  tabs: Tab[];
  activeTabId: string | null;
  onTabClick: (id: string) => void;
  onTabClose: (id: string, e: React.MouseEvent) => void;
  onNewTab: () => void;
  onNavigate: (url: string) => void;
  addressValue: string;
  onAddressChange: (value: string) => void;
  onAddressSubmit: (e: React.FormEvent) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  appId: string;
  /** Optional circuit state for Shade browser */
  circuit?: CircuitState;
  connected?: boolean;
  /** Custom content renderer for the active tab */
  renderTabContent?: (tab: Tab, browserAppId: string) => React.ReactNode;
  /** Custom start page renderer */
  renderStartPage?: (browserAppId: string) => React.ReactNode;
}

export function BrowserTabs({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onNewTab,
  onNavigate,
  addressValue,
  onAddressChange,
  onAddressSubmit,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  appId: browserAppId,
  circuit,
  connected,
  renderTabContent,
  renderStartPage,
}: BrowserTabsProps) {
  const activeTab = tabs.find(t => t.id === activeTabId);
  const gameDateTime = useGameStore(s => s.gameDateTime);
  const addBrowserHistory = useGameStore(s => s.addBrowserHistory);

  // Record history when tab loads (default behavior)
  useEffect(() => {
    if (activeTab && !activeTab.loading && activeTab.url.startsWith('hxxp')) {
      addBrowserHistory({
        appId: browserAppId,
        url: activeTab.url,
        title: activeTab.title,
      });
    }
  }, [activeTab?.url, activeTab?.loading, activeTab?.title, browserAppId, addBrowserHistory, gameDateTime]);

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate(addressValue);
  };

  // Circuit indicator for Shade
  const showCircuit = circuit && (circuit.stage !== 'idle' || connected);

  return (
    <AppShell
      title="브라우저"
      largeTitle={!activeTab}
      className="flex flex-col relative"
    >
      {/* Address Bar */}
      <div className="glass-strong sticky top-0 z-10 flex items-center gap-2 border-b border-ios-separator/20 px-3 py-2">
        <button
          type="button"
          disabled={!canGoBack}
          onClick={onBack}
          className="p-2 rounded-xl text-ios-muted hover:text-ios-text hover:bg-ios-separator/15 disabled:opacity-40"
          aria-label="뒤로"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          disabled={!canGoForward}
          onClick={onForward}
          className="p-2 rounded-xl text-ios-muted hover:text-ios-text hover:bg-ios-separator/15 disabled:opacity-40"
          aria-label="앞으로"
        >
          <ChevronRight className="size-5" />
        </button>
        <form onSubmit={handleAddressSubmit} className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={addressValue}
            onChange={e => onAddressChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddressSubmit(e)}
            placeholder="주소 또는 검색어 입력"
            className="flex-1 bg-transparent text-[15px] text-ios-text placeholder:text-ios-muted focus:outline-none"
            autoComplete="off"
            spellCheck={false}
          />
        </form>
        <button
          type="button"
          onClick={onNewTab}
          className="p-2 rounded-xl text-ios-muted hover:text-ios-text hover:bg-ios-separator/15"
          aria-label="새 탭"
        >
          <Plus className="size-5" />
        </button>
      </div>

      {/* Tab Bar */}
      <div className="glass-strong sticky top-[var(--ios-navbar-h)] z-10 border-b border-ios-separator/20 px-2 py-1.5">
        <div className="flex items-end gap-1 overflow-x-auto no-scrollbar pb-0.5">
          {tabs.map((tab, index) => (
            <TabItem
              key={tab.id}
              tab={tab}
              active={tab.id === activeTabId}
              onClick={() => onTabClick(tab.id)}
              onClose={e => onTabClose(tab.id, e)}
              index={index}
            />
          ))}
          <button
            onClick={onNewTab}
            className="flex shrink-0 items-center justify-center w-10 h-8 rounded-xl text-ios-muted hover:text-ios-text hover:bg-ios-separator/15"
            aria-label="새 탭"
          >
            <Plus className="size-5" />
          </button>
        </div>
      </div>

      {/* Circuit indicator overlay for Shade */}
      {showCircuit && (
        <CircuitIndicatorOverlay circuit={circuit!} connected={connected ?? false} />
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab ? (
            renderTabContent
              ? renderTabContent(activeTab, browserAppId)
              : <BrowserTabContent key={activeTab.id} tab={activeTab} browserAppId={browserAppId} />
          ) : (
            renderStartPage
              ? renderStartPage(browserAppId)
              : <BrowserStartPage key="start" browserAppId={browserAppId} />
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

function CircuitIndicatorOverlay({ circuit, connected }: { circuit: CircuitState; connected: boolean }) {
  const reduced = prefersReducedMotion();
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

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2 px-3 py-2 rounded-2xl bg-ios-surface/95 backdrop-blur ring-1 ring-black/5 dark:ring-white/5 shadow-lg pointer-events-none">
      <div className="flex items-center gap-2 text-[11px] text-ios-muted">
        <div
          className={cn(
            'size-2 rounded-full',
            connected ? 'bg-ios-green animate-pulse' : 'bg-ios-red'
          )}
        />
        <span>{circuit.message}</span>
      </div>

      {!reduced && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative size-32"
        >
          <svg viewBox="0 0 100 100" className="size-full">
            {/* Edges */}
            {CIRCUIT_EDGES.map(([from, to], edgeIndex) => {
              const isActive = circuit.activeEdges.some(([a, b]) =>
                (a === from && b === to) || (a === to && b === from)
              );
              const nodeFrom = CIRCUIT_NODES[from];
              const nodeTo = CIRCUIT_NODES[to];
              return (
                <motion.line
                  key={edgeIndex}
                  x1={nodeFrom.x}
                  y1={nodeFrom.y}
                  x2={nodeTo.x}
                  y2={nodeTo.y}
                  stroke={isActive ? '#22d3ee' : '#334155'}
                  strokeWidth={isActive ? 1.5 : 1}
                  strokeDasharray={isActive ? '4 4' : 'none'}
                  opacity={isActive ? 0.8 : 0.3}
                  animate={{
                    strokeDashoffset: isActive ? [0, -8] : 0,
                  }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              );
            })}

            {/* Nodes */}
            {CIRCUIT_NODES.map((node, nodeIndex) => {
              const isActive = circuit.activeNodes.includes(nodeIndex);
              return (
                <motion.circle
                  key={nodeIndex}
                  cx={node.x}
                  cy={node.y}
                  r={isActive ? 3 : 2}
                  fill={isActive ? '#22d3ee' : '#475569'}
                  animate={{
                    r: isActive ? [3, 4, 3] : 2,
                    opacity: isActive ? [0.8, 1, 0.8] : 0.5,
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: nodeIndex * 0.1 }}
                />
              );
            })}
          </svg>
        </motion.div>
      )}
    </div>
  );
}

function BrowserStartPage({ browserAppId }: { browserAppId: string }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl bg-ios-surface px-3 py-2 ring-1 ring-black/5 dark:ring-white/5">
        <Search className="size-4 text-ios-muted" />
        <span className="text-[14px] text-ios-muted">게임 속 가짜 검색 결과</span>
      </div>

      <Section header="암시장 목록" footer="사이트의 진위는 직접 판단해야 합니다.">
        {markets.map((market) => (
          <Row
            key={market.id}
            icon={<Search className="size-4 text-ios-accent" />}
            title={market.name}
            subtitle={market.tagline}
            trailing={<span className="text-ios-separator">›</span>}
            onClick={() => {
              const tabId = `tab-${Date.now()}`;
              // Navigation handled by parent
            }}
            className="cursor-pointer"
          />
        ))}
      </Section>

      <Section header="방문 기록" footer="기록은 게임 내 브라우저에만 남습니다.">
        <Row
          icon={<Search className="size-4 text-ios-muted" />}
          title="기록이 없습니다"
          subtitle="방문한 사이트가 여기에 표시됩니다"
        />
      </Section>
    </div>
  );
}

function BrowserTabContent({
  tab,
  browserAppId,
}: {
  tab: Tab;
  browserAppId: string;
}) {
  const market = tab.marketId ? markets.find(m => m.id === tab.marketId) : null;

  if (market) {
    const score = suspicionScore(market, clues);
    return (
      <div className="p-4">
        <div className="glass sticky top-0 mb-4 flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-black/5">
          <span className="truncate text-[13px] text-ios-muted">{tab.url}</span>
        </div>

        <h2 className="text-[22px] font-bold">{market.name}</h2>
        <p className="mt-1 text-[13px] text-ios-muted">{market.tagline}</p>

        <div className="mt-4 rounded-2xl bg-ios-surface p-4 ring-1 ring-black/5 dark:ring-white/5">
          <p className="text-[12px] font-medium text-ios-muted">단서 (일부는 노이즈입니다)</p>
          <ul className="mt-2 space-y-1.5">
            {market.traits.map((trait) => (
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
      </div>
      <h2 className="text-[22px] font-bold">{tab.title}</h2>
      <p className="mt-4 text-[14px] text-ios-muted">이 사이트는 게임 내 허구 콘텐츠입니다.</p>
    </div>
  );
}