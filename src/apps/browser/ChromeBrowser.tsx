import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Globe,
  MoreVertical,
  Plus,
  RotateCw,
  Search,
  ShieldAlert,
  Star,
  X,
} from 'lucide-react';
import { markets } from '@/data';
import { browserAccess, browserReachHint, listedMarkets } from '@/game';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/utils/cn';
import { SPRING_SNAPPY } from '@/utils/motion';
import { useBrowser } from './useBrowser';
import { BlockedPage, MarketLinks, SiteView } from './BrowserSite';
import {
  START_URLS,
  displayHost,
  isBlankTab,
  type BrowserTab,
} from './browserData';

/** Chroma — a Chrome-flavoured browser: tab strip, omnibox, star and ⋮ menu. */
export function ChromeBrowser() {
  const browser = useBrowser({ initialUrl: START_URLS.chroma, appId: 'chroma' });
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const history = useGameStore((s) => s.browserHistory);
  const recent = history.filter((entry) => entry.appId === 'chroma').slice(0, 5);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  const { activeTab, address, setAddress, navigate, goBack, goForward, canGoBack, canGoForward, openTab, closeTab, selectTab } =
    browser;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setEditing(false);
    navigate(address);
  };

  const startPage = isBlankTab(activeTab);
  const listed = listedMarkets(markets, 'chroma');

  // Chroma has no route onto the onion network at all.
  const targetMarket = activeTab?.marketId
    ? markets.find((market) => market.id === activeTab.marketId)
    : null;
  const access = targetMarket
    ? browserAccess(targetMarket, 'chroma')
    : activeTab && !activeTab.url.includes('.onion')
      ? ({ ok: true } as const)
      : ({ ok: false, reason: 'blocked-onion' } as const);

  return (
    <div className="flex h-full flex-col bg-[#f1f3f4] text-[#202124] dark:bg-[#202124] dark:text-[#e8eaed]">
      {/* tab strip */}
      <div className="flex shrink-0 items-end gap-0.5 bg-[#dee1e6] px-1 pt-[var(--ios-statusbar-h)] dark:bg-[#202124]">
        <div className="no-scrollbar flex flex-1 items-end gap-0.5 overflow-x-auto pb-px">
          {browser.tabs.map((tab) => (
            <ChromeTab
              key={tab.id}
              tab={tab}
              active={tab.id === browser.activeId}
              onSelect={() => selectTab(tab.id)}
              onClose={() => closeTab(tab.id)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => openTab()}
          aria-label="새 탭"
          className="mb-1 flex size-8 items-center justify-center rounded-full text-[#5f6368] dark:text-[#9aa0a6]"
        >
          <Plus className="size-5" aria-hidden />
        </button>
      </div>

      {/* toolbar */}
      <div className="relative z-20 flex shrink-0 items-center gap-0.5 bg-white px-1 py-1.5 shadow-sm dark:bg-[#35363a]">
        <NavButton label="뒤로" disabled={!canGoBack} onClick={goBack}>
          <ArrowLeft className="size-5" aria-hidden />
        </NavButton>
        <NavButton label="앞으로" disabled={!canGoForward} onClick={goForward}>
          <ArrowRight className="size-5" aria-hidden />
        </NavButton>
        <NavButton
          label={activeTab?.loading ? '로딩 중지' : '새로고침'}
          onClick={() => activeTab && navigate(activeTab.url)}
        >
          {activeTab?.loading ? (
            <X className="size-5" aria-hidden />
          ) : (
            <RotateCw className="size-[18px]" aria-hidden />
          )}
        </NavButton>

        <form onSubmit={submit} className="mx-1 flex flex-1 items-center">
          <div className="flex h-9 w-full items-center gap-2 rounded-full bg-[#f1f3f4] px-3 dark:bg-[#202124]">
            <ShieldAlert className="size-4 shrink-0 text-[#e37400]" aria-hidden />
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
              className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#80868b]"
            />
          </div>
        </form>

        <NavButton label="즐겨찾기 추가">
          <Star className="size-[18px]" aria-hidden />
        </NavButton>

        <div className="relative" ref={menuRef}>
          <NavButton label="메뉴" onClick={() => setMenuOpen((value) => !value)}>
            <MoreVertical className="size-5" aria-hidden />
          </NavButton>
          <AnimatePresence>
            {menuOpen ? (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={SPRING_SNAPPY}
                className="absolute right-0 top-11 z-30 w-52 overflow-hidden rounded-xl bg-white py-1 text-[14px] shadow-2xl ring-1 ring-black/10 dark:bg-[#292a2d] dark:ring-white/10"
              >
                {[
                  { label: '새 탭', action: () => openTab() },
                  { label: '새 시크릿 탭', action: () => openTab() },
                  { label: '방문 기록', action: () => navigate('hxxp://') },
                  { label: '즐겨찾기', action: () => navigate('hxxp://') },
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
      </div>

      {/* loading bar */}
      <div className="relative h-0.5 shrink-0 bg-transparent">
        {activeTab?.loading ? (
          <motion.div
            className="h-full bg-[#1a73e8]"
            animate={{ width: `${(activeTab.progress || 0.1) * 100}%` }}
            transition={{ duration: 0.15 }}
          />
        ) : null}
      </div>

      {/* content */}
      <div className="scroll-area no-scrollbar flex-1">
        {startPage ? (
          <ChromeStartPage onNavigate={navigate} recent={recent} listed={listed} />
        ) : !activeTab ? null : access.ok ? (
          <SiteView tab={activeTab} />
        ) : (
          <BlockedPage
            browser="chroma"
            reason={access.reason}
            url={activeTab.url}
            onRetry={() => navigate(activeTab.url)}
          />
        )}
      </div>
    </div>
  );
}

function NavButton({
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
        'flex size-9 shrink-0 items-center justify-center rounded-full',
        disabled ? 'text-[#bdc1c6] dark:text-[#5f6368]' : 'text-[#5f6368] dark:text-[#9aa0a6]',
      )}
    >
      {children}
    </button>
  );
}

function ChromeTab({
  tab,
  active,
  onSelect,
  onClose,
}: {
  tab: BrowserTab;
  active: boolean;
  onSelect: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, width: 0 }}
      transition={SPRING_SNAPPY}
      className={cn(
        'group relative flex h-9 min-w-[112px] max-w-[180px] items-center gap-1.5 rounded-t-[10px] px-2.5 text-[12px]',
        active
          ? 'bg-white text-[#202124] dark:bg-[#35363a] dark:text-[#e8eaed]'
          : 'bg-[#d3d6db]/70 text-[#5f6368] dark:bg-[#292a2d]/70 dark:text-[#9aa0a6]',
      )}
    >
      <span
        className="absolute inset-x-3 top-0 h-[2px] rounded-full bg-[#1a73e8]"
        style={{ opacity: active ? 1 : 0 }}
        aria-hidden
      />
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-1.5">
        <Globe className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">{tab.loading ? '로딩 중…' : tab.title}</span>
      </button>
      <button type="button" onClick={onClose} aria-label="탭 닫기" className="shrink-0">
        <X className="size-3.5" aria-hidden />
      </button>
    </motion.div>
  );
}

function ChromeStartPage({
  onNavigate,
  recent,
  listed,
}: {
  onNavigate: (url: string) => void;
  recent: { id: string; url: string; title: string }[];
  listed: ReturnType<typeof listedMarkets>;
}) {
  return (
    <div className="px-4 pb-10 pt-6">
      <div className="mb-6 flex flex-col items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-full bg-white text-[20px] font-bold text-[#1a73e8] shadow-sm dark:bg-[#35363a]">
          C
        </span>
        <div className="flex h-11 w-full max-w-[320px] items-center gap-2 rounded-full bg-white px-4 shadow-sm ring-1 ring-black/5 dark:bg-[#35363a] dark:ring-white/10">
          <Search className="size-4 text-[#80868b]" aria-hidden />
          <span className="text-[14px] text-[#80868b]">암시장 검색 (허구)</span>
        </div>
      </div>

      <p className="mb-3 rounded-xl bg-white px-3 py-2 text-[11px] leading-relaxed text-[#5f6368] ring-1 ring-black/5 dark:bg-[#35363a] dark:text-[#9aa0a6] dark:ring-white/10">
        {browserReachHint('chroma')}
      </p>

      <h3 className="mb-3 px-1 text-[12px] font-medium text-[#5f6368] dark:text-[#9aa0a6]">
        바로가기
      </h3>
      <MarketLinks markets={listed} onNavigate={onNavigate} variant="grid" />

      <h3 className="mb-3 mt-8 flex items-center gap-1.5 px-1 text-[12px] font-medium text-[#5f6368] dark:text-[#9aa0a6]">
        <Clock className="size-3.5" aria-hidden /> 최근 방문
      </h3>
      {recent.length === 0 ? (
        <p className="rounded-xl bg-white px-4 py-6 text-center text-[13px] text-[#5f6368] dark:bg-[#35363a] dark:text-[#9aa0a6]">
          방문 기록이 없습니다.
        </p>
      ) : (
        <ul className="divide-y divide-black/5 overflow-hidden rounded-xl bg-white ring-1 ring-black/5 dark:divide-white/5 dark:bg-[#35363a] dark:ring-white/10">
          {recent.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onNavigate(entry.url)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left"
              >
                <Globe className="size-4 shrink-0 text-[#5f6368]" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px]">{entry.title}</span>
                  <span className="block truncate text-[11px] text-[#5f6368]">{entry.url}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
