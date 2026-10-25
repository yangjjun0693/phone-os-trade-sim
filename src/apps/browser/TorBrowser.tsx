import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Eraser,
  Globe,
  Menu,
  RefreshCw,
  RotateCw,
  Shield,
  X,
} from 'lucide-react';
import { markets } from '@/data';
import { browserAccess, browserReachHint, listedMarkets } from '@/game';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/utils/cn';
import { SPRING_SNAPPY } from '@/utils/motion';
import { useBrowser } from './useBrowser';
import { BlockedPage, MarketLinks, SiteView } from './BrowserSite';
import { START_URLS, displayHost, isBlankTab, marketIdFromUrl } from './browserData';

/** In-game minutes a page load costs. The onion layer is slow. */
const LOAD_MINUTES = { onion: 10, other: 3 } as const;

const CIRCUIT_NODES = [
  { x: 12, y: 50 },
  { x: 38, y: 22 },
  { x: 62, y: 62 },
  { x: 88, y: 34 },
];
const CIRCUIT_EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
];

const SECURITY_LEVELS = ['표준', '더 안전', '가장 안전'] as const;

/**
 * Shade — a Tor-Browser-flavoured browser: dark chrome, onion address bar,
 * circuit display, security level and "새 신원".
 */
export function TorBrowser() {
  const browser = useBrowser({
    initialUrl: START_URLS.shade,
    appId: 'shade',
    speedMs: 150,
    shouldRecord: () => Math.random() < 0.1,
  });
  const [editing, setEditing] = useState(false);
  const [showCircuit, setShowCircuit] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [security, setSecurity] = useState<(typeof SECURITY_LEVELS)[number]>('표준');
  const [circuitKey, setCircuitKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const {
    activeTab,
    address,
    setAddress,
    navigate: rawNavigate,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    openTab,
    closeTab,
    tabs,
    activeId,
    selectTab,
  } = browser;

  const discovered = useGameStore((s) => s.discoveredMarkets);
  const addHeat = useGameStore((s) => s.addHeat);
  const advanceGameTime = useGameStore((s) => s.advanceGameTime);
  const shadeIdentity = useGameStore((s) => s.identities.shade?.active);

  /**
   * Shade pays for its reach in time. Loading over the onion layer also warns
   * when the player is browsing with their real name attached.
   */
  const navigate = (url: string) => {
    rawNavigate(url);
    const market = markets.find((entry) => entry.id === marketIdFromUrl(url));
    const minutes = market?.reach === 'onion' ? LOAD_MINUTES.onion : LOAD_MINUTES.other;
    advanceGameTime(minutes);
    if (market?.reach === 'onion' && shadeIdentity === 'realname') {
      addHeat(6);
      flash('실명 신원으로 다크넷에 접속했습니다. (heat +6)');
    }
  };

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setEditing(false);
    navigate(address);
  };

  const newCircuit = () => {
    setCircuitKey((value) => value + 1);
    setShowCircuit(true);
    flash('새 회로를 만들었습니다.');
  };

  const newIdentity = () => {
    setCircuitKey((value) => value + 1);
    openTab('hxxp://');
    flash('새 신원을 만들었습니다. 회로와 기록을 비웠습니다.');
  };

  const startPage = isBlankTab(activeTab);
  const listed = listedMarkets(markets, 'shade', discovered);
  const targetMarket = activeTab?.marketId
    ? markets.find((market) => market.id === activeTab.marketId)
    : null;
  const access = targetMarket
    ? browserAccess(targetMarket, 'shade', discovered)
    : activeTab && !activeTab.url.includes('.onion')
      ? ({ ok: true } as const)
      : ({ ok: false, reason: 'server-not-found' } as const);

  return (
    <div className="relative flex h-full flex-col bg-[#1c1b22] text-[#f0e9f6]">
      {/* toolbar */}
      <div className="shrink-0 bg-[#2b2a33] pt-[var(--ios-statusbar-h)]">
        <div className="flex items-center gap-0.5 px-1 py-1.5">
          <TorButton label="뒤로" disabled={!canGoBack} onClick={goBack}>
            <ArrowLeft className="size-5" aria-hidden />
          </TorButton>
          <TorButton label="앞으로" disabled={!canGoForward} onClick={goForward}>
            <ArrowRight className="size-5" aria-hidden />
          </TorButton>
          <TorButton
            label={activeTab?.loading ? '로딩 중지' : '새로고침'}
            onClick={() => activeTab && navigate(activeTab.url)}
          >
            {activeTab?.loading ? (
              <X className="size-5" aria-hidden />
            ) : (
              <RotateCw className="size-[18px]" aria-hidden />
            )}
          </TorButton>

          <form onSubmit={submit} className="mx-1 flex flex-1 items-center">
            <div className="flex h-9 w-full items-center gap-2 rounded-lg bg-[#1c1b22] px-3 ring-1 ring-white/10">
              <span
                className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#7d4698] text-[9px]"
                aria-hidden
              >
                🧅
              </span>
              <input
                value={editing ? address : displayHost(address)}
                onChange={(event) => setAddress(event.target.value)}
                onFocus={() => {
                  setEditing(true);
                  setAddress(activeTab?.url ?? '');
                }}
                onBlur={() => setEditing(false)}
                aria-label="주소 및 검색어 입력"
                placeholder="주소 또는 검색어 입력"
                autoComplete="off"
                spellCheck={false}
                className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#9a93a8]"
              />
            </div>
          </form>

          <TorButton label="메뉴" onClick={() => setMenuOpen((value) => !value)}>
            <Menu className="size-5" aria-hidden />
          </TorButton>
        </div>

        {/* Tor-specific controls */}
        <div className="flex items-center gap-1.5 border-t border-white/5 px-2 py-1.5">
          <button
            type="button"
            onClick={newCircuit}
            className="flex h-7 items-center gap-1.5 rounded-full bg-[#3b3a45] px-3 text-[11px] font-medium"
          >
            <RefreshCw className="size-3.5 text-[#c08ad8]" aria-hidden /> 새 회로
          </button>
          <button
            type="button"
            onClick={newIdentity}
            className="flex h-7 items-center gap-1.5 rounded-full bg-[#3b3a45] px-3 text-[11px] font-medium"
          >
            <Eraser className="size-3.5 text-[#c08ad8]" aria-hidden /> 새 신원
          </button>
          <button
            type="button"
            onClick={() =>
              setSecurity(
                SECURITY_LEVELS[(SECURITY_LEVELS.indexOf(security) + 1) % SECURITY_LEVELS.length],
              )
            }
            className="ml-auto flex h-7 items-center gap-1.5 rounded-full bg-[#7d4698]/30 px-3 text-[11px] font-medium text-[#e0c2ef]"
          >
            <Shield className="size-3.5" aria-hidden /> {security}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={SPRING_SNAPPY}
              className="absolute right-2 top-[calc(var(--ios-statusbar-h)+3.25rem)] z-30 w-56 overflow-hidden rounded-xl bg-[#2b2a33] py-1 text-[13px] shadow-2xl ring-1 ring-white/10"
            >
              {[
                { label: '새 탭', action: () => openTab() },
                { label: '새 회로', action: newCircuit },
                { label: '새 신원', action: newIdentity },
                { label: '회로 표시', action: () => setShowCircuit((value) => !value) },
                { label: '설정', action: () => undefined },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    item.action();
                    setMenuOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left"
                >
                  {item.label}
                </button>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* loading bar */}
      <div className="h-0.5 shrink-0 bg-transparent">
        {activeTab?.loading ? (
          <motion.div
            className="h-full bg-[#7d4698]"
            animate={{ width: `${(activeTab.progress || 0.1) * 100}%` }}
            transition={{ duration: 0.15 }}
          />
        ) : null}
      </div>

      {/* circuit display */}
      <AnimatePresence initial={false}>
        {showCircuit ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRING_SNAPPY}
            className="shrink-0 overflow-hidden border-b border-white/5 bg-[#20123a]"
          >
            <div className="flex items-center gap-3 px-3 py-2.5">
              <svg viewBox="0 0 100 100" className="size-14 shrink-0" aria-hidden>
                {CIRCUIT_EDGES.map(([from, to], index) => (
                  <motion.line
                    key={`${circuitKey}-${index}`}
                    x1={CIRCUIT_NODES[from].x}
                    y1={CIRCUIT_NODES[from].y}
                    x2={CIRCUIT_NODES[to].x}
                    y2={CIRCUIT_NODES[to].y}
                    stroke="#9b57c4"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.85 }}
                    transition={{ duration: 0.5, delay: index * 0.12 }}
                  />
                ))}
                {CIRCUIT_NODES.map((node, index) => (
                  <motion.circle
                    key={`${circuitKey}-n-${index}`}
                    cx={node.x}
                    cy={node.y}
                    r={4}
                    fill={index === CIRCUIT_NODES.length - 1 ? '#c08ad8' : '#7d4698'}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.25, delay: 0.1 + index * 0.12 }}
                  />
                ))}
              </svg>
              <div className="min-w-0 flex-1 text-[12px]">
                <p className="font-semibold text-[#e0c2ef]">이 사이트의 회로</p>
                <p className="mt-0.5 truncate text-[#b9b2c6]">네덜란드 → 독일 → 미국</p>
                <p className="mt-1 text-[10px] text-[#8d869c]">
                  3개의 릴레이를 경유했습니다 · 허구의 시뮬레이션입니다
                </p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* tab strip */}
      <div className="no-scrollbar flex shrink-0 items-center gap-1 overflow-x-auto border-b border-white/5 bg-[#1c1b22] px-1.5 py-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => selectTab(tab.id)}
            className={cn(
              'flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-[11px]',
              tab.id === activeId ? 'bg-[#3b3a45] text-white' : 'text-[#9a93a8]',
            )}
          >
            <Globe className="size-3 shrink-0" aria-hidden />
            <span className="max-w-[110px] truncate">{tab.loading ? '로딩 중…' : tab.title}</span>
            <span
              role="button"
              tabIndex={-1}
              aria-label="탭 닫기"
              onClick={(event) => {
                event.stopPropagation();
                closeTab(tab.id);
              }}
              className="shrink-0"
            >
              <X className="size-3" aria-hidden />
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => openTab()}
          aria-label="새 탭"
          className="ml-0.5 flex size-7 shrink-0 items-center justify-center rounded-md text-[#9a93a8]"
        >
          +
        </button>
      </div>

      {/* content */}
      <div className="scroll-area no-scrollbar flex-1">
        {startPage ? (
          <TorStartPage onNavigate={navigate} onNewCircuit={newCircuit} listed={listed} />
        ) : !activeTab ? null : access.ok ? (
          <SiteView tab={activeTab} />
        ) : (
          <BlockedPage
            browser="shade"
            reason={access.reason}
            url={activeTab.url}
            onRetry={newCircuit}
          />
        )}
      </div>

      {/* toast */}
      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={SPRING_SNAPPY}
            className="absolute inset-x-4 bottom-6 z-40 rounded-xl bg-[#2b2a33] px-4 py-3 text-center text-[12px] shadow-2xl ring-1 ring-white/10"
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function TorButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-md',
        disabled ? 'text-[#5b5568]' : 'text-[#d7d0e0]',
      )}
    >
      {children}
    </button>
  );
}

function TorStartPage({
  onNavigate,
  onNewCircuit,
  listed,
}: {
  onNavigate: (url: string) => void;
  onNewCircuit: () => void;
  listed: ReturnType<typeof listedMarkets>;
}) {
  return (
    <div className="px-4 pb-10 pt-5">
      <div className="rounded-2xl bg-[#2b2a33] p-4 ring-1 ring-white/5">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#4ade80]" aria-hidden />
          <span className="text-[13px] font-semibold text-[#e0c2ef]">회로 연결됨</span>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-[#b9b2c6]">
          Shade는 트래픽을 여러 릴레이로 경유시킵니다. 방문 기록은 거의 남기지 않으며 연결이
          불안정할 수 있습니다. (허구의 시뮬레이션입니다)
        </p>
        <button
          type="button"
          onClick={onNewCircuit}
          className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#7d4698] text-[13px] font-semibold text-white"
        >
          <RefreshCw className="size-4" aria-hidden /> 새 회로 만들기
        </button>
      </div>

      <p className="mt-3 rounded-xl bg-[#2b2a33] px-3 py-2 text-[11px] leading-relaxed text-[#b9b2c6] ring-1 ring-white/5">
        {browserReachHint('shade')}
      </p>

      <h3 className="mb-3 mt-6 px-1 text-[12px] font-medium text-[#9a93a8]">
        알려진 .onion 주소 ({listed.length})
      </h3>
      <div className="[&_button]:text-[#f0e9f6] [&_li]:bg-[#2b2a33] [&_span]:text-[#b9b2c6] [&_ul]:bg-transparent [&_ul]:divide-white/5 [&_ul]:ring-white/5">
        <MarketLinks markets={listed} onNavigate={onNavigate} />
      </div>
      <p className="mt-3 px-1 text-[11px] leading-relaxed text-[#8d869c]">
        새 주소는 커뮤니티(포럼·Ex)에서 얻습니다. 초대 전용 사이트는 코드가 있어야
        열립니다.
      </p>
    </div>
  );
}
