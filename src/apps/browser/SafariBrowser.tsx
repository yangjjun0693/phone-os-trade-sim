import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCw,
  Share,
  SquareStack,
  X,
} from 'lucide-react';
import { markets } from '@/data';
import { browserAccess, browserReachHint, listedMarkets } from '@/game';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/utils/cn';
import { SPRING_SNAPPY, SPRING_SOFT } from '@/utils/motion';
import { useBrowser } from './useBrowser';
import { BlockedPage, MarketLinks, SiteView } from './BrowserSite';
import { START_URLS, displayHost, isBlankTab, marketIdFromUrl } from './browserData';

/** Sailor — an iOS-Safari-flavoured browser: slim top bar, bottom toolbar, tab grid. */
export function SafariBrowser() {
  const browser = useBrowser({ initialUrl: START_URLS.sailor, appId: 'sailor' });
  const [editing, setEditing] = useState(false);
  const [showTabs, setShowTabs] = useState(false);
  const [showPageMenu, setShowPageMenu] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const history = useGameStore((s) => s.browserHistory);
  const addHeat = useGameStore((s) => s.addHeat);
  const recent = history.filter((entry) => entry.appId === 'sailor').slice(0, 6);

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
    selectTab,
  } = browser;

  /**
   * Sailor reaches mirrors, and mirror sites leave a trace: every load costs a
   * little heat. That is the price of the faster, friendlier browser.
   */
  const navigate = (url: string) => {
    rawNavigate(url);
    const market = markets.find((entry) => entry.id === marketIdFromUrl(url));
    if (market && market.traceHeat > 0) {
      addHeat(market.traceHeat);
      setNotice(`미러 사이트 방문 기록이 남았습니다. (heat +${market.traceHeat})`);
      window.setTimeout(() => setNotice(null), 2600);
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setEditing(false);
    navigate(address);
  };

  const startPage = isBlankTab(activeTab);
  const listed = listedMarkets(markets, 'sailor');
  const targetMarket = activeTab?.marketId
    ? markets.find((market) => market.id === activeTab.marketId)
    : null;
  const access = targetMarket
    ? browserAccess(targetMarket, 'sailor')
    : activeTab && !activeTab.url.includes('.onion')
      ? ({ ok: true } as const)
      : ({ ok: false, reason: 'server-not-found' } as const);

  return (
    <div className="relative flex h-full flex-col bg-ios-bg text-ios-text">
      {/* top bar */}
      <div className="glass-strong relative z-20 shrink-0 border-b border-ios-separator/20 pt-[var(--ios-statusbar-h)]">
        <div className="flex h-11 items-center gap-1 px-2">
          <button
            type="button"
            onClick={() => setShowPageMenu((value) => !value)}
            aria-label="페이지 설정"
            className="flex size-9 items-center justify-center rounded-full text-[15px] font-semibold text-ios-accent"
          >
            aA
          </button>

          <form onSubmit={submit} className="flex flex-1 items-center">
            <div className="flex h-8 w-full items-center justify-center gap-1.5 rounded-xl bg-ios-separator/15 px-3">
              <span className="text-[13px] text-ios-muted" aria-hidden>
                🔒
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
                placeholder="검색어 또는 웹 주소"
                autoComplete="off"
                spellCheck={false}
                className="min-w-0 flex-1 bg-transparent text-center text-[14px] outline-none placeholder:text-ios-muted"
              />
            </div>
          </form>

          <button
            type="button"
            aria-label={activeTab?.loading ? '로딩 중지' : '새로고침'}
            onClick={() => activeTab && navigate(activeTab.url)}
            className="flex size-9 items-center justify-center rounded-full text-ios-accent"
          >
            {activeTab?.loading ? (
              <X className="size-5" aria-hidden />
            ) : (
              <RotateCw className="size-[18px]" aria-hidden />
            )}
          </button>
        </div>

        <div className="relative h-0.5">
          {activeTab?.loading ? (
            <motion.div
              className="h-full bg-ios-accent"
              animate={{ width: `${(activeTab.progress || 0.1) * 100}%` }}
              transition={{ duration: 0.15 }}
            />
          ) : null}
        </div>

        <AnimatePresence>
          {showPageMenu ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={SPRING_SNAPPY}
              className="absolute left-2 top-[calc(var(--ios-statusbar-h)+2.75rem)] z-30 w-56 overflow-hidden rounded-2xl bg-ios-surface text-[14px] shadow-2xl ring-1 ring-black/10 dark:ring-white/10"
            >
              {['데스크톱 웹사이트 요청', '리더기 보기', '개인정보 보호 리포트', '설정'].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setShowPageMenu(false)}
                  className="block w-full border-b border-ios-separator/15 px-4 py-2.5 text-left last:border-b-0"
                >
                  {label}
                </button>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* trace notice */}
      <AnimatePresence>
        {notice ? (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={SPRING_SNAPPY}
            className="z-10 mx-4 mt-2 rounded-xl bg-ios-orange/15 px-3 py-2 text-center text-[12px] text-ios-orange"
          >
            {notice}
          </motion.p>
        ) : null}
      </AnimatePresence>

      {/* content */}
      <div className="scroll-area no-scrollbar flex-1">
        {startPage ? (
          <SafariStartPage onNavigate={navigate} recent={recent} listed={listed} />
        ) : !activeTab ? null : access.ok ? (
          <SiteView tab={activeTab} />
        ) : (
          <BlockedPage
            browser="sailor"
            reason={access.reason}
            url={activeTab.url}
            onRetry={() => navigate(activeTab.url)}
          />
        )}
      </div>

      {/* bottom toolbar */}
      <div className="glass-strong z-20 flex shrink-0 items-center justify-between border-t border-ios-separator/20 px-6 pb-[max(env(safe-area-inset-bottom),10px)] pt-2.5 text-ios-accent">
        <ToolbarButton label="뒤로" disabled={!canGoBack} onClick={goBack}>
          <ChevronLeft className="size-6" aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="앞으로" disabled={!canGoForward} onClick={goForward}>
          <ChevronRight className="size-6" aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="공유">
          <Share className="size-5" aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="책갈피">
          <BookOpen className="size-5" aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="탭" onClick={() => setShowTabs(true)}>
          <SquareStack className="size-5" aria-hidden />
          <span className="absolute -bottom-0.5 ml-3 text-[10px] font-semibold">
            {browser.tabs.length}
          </span>
        </ToolbarButton>
      </div>

      {/* tab overview */}
      <AnimatePresence>
        {showTabs ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-ios-bg/95 backdrop-blur-md"
          >
            <div className="flex h-full flex-col pt-[var(--ios-statusbar-h)]">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[15px] font-semibold">
                  {browser.tabs.length}개의 탭
                </span>
                <button
                  type="button"
                  onClick={() => setShowTabs(false)}
                  aria-label="탭 닫기"
                  className="flex size-9 items-center justify-center rounded-full bg-ios-separator/15 text-ios-muted"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>

              <div className="scroll-area no-scrollbar flex-1 px-4 pb-6">
                <div className="grid grid-cols-2 gap-3">
                  {browser.tabs.map((tab) => {
                    const active = tab.id === browser.activeId;
                    return (
                      <motion.div
                        key={tab.id}
                        layout
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={SPRING_SOFT}
                        className={cn(
                          'relative overflow-hidden rounded-2xl bg-ios-surface shadow-sm ring-1',
                          active ? 'ring-ios-accent' : 'ring-black/5 dark:ring-white/10',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            selectTab(tab.id);
                            setShowTabs(false);
                          }}
                          className="block w-full text-left"
                        >
                          <div className="flex items-center gap-1.5 border-b border-ios-separator/15 px-3 py-2">
                            <span className="text-[11px]">🔒</span>
                            <span className="truncate text-[12px] text-ios-muted">
                              {displayHost(tab.url)}
                            </span>
                          </div>
                          <div className="flex h-28 items-center justify-center bg-ios-bg px-3 text-center">
                            <span className="truncate text-[12px] text-ios-muted">{tab.title}</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => closeTab(tab.id)}
                          aria-label="탭 닫기"
                          className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-ios-separator/25 text-ios-muted"
                        >
                          <X className="size-3.5" aria-hidden />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    openTab();
                    setShowTabs(false);
                  }}
                  className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ios-surface text-[15px] font-medium text-ios-accent ring-1 ring-black/5 dark:ring-white/10"
                >
                  <Plus className="size-5" aria-hidden /> 새 탭
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ToolbarButton({
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
        'relative flex size-10 items-center justify-center rounded-full',
        disabled ? 'text-ios-separator' : 'text-ios-accent',
      )}
    >
      {children}
    </button>
  );
}

function SafariStartPage({
  onNavigate,
  recent,
  listed,
}: {
  onNavigate: (url: string) => void;
  recent: { id: string; url: string; title: string }[];
  listed: ReturnType<typeof listedMarkets>;
}) {
  return (
    <div className="px-4 pb-10 pt-5">
      <p className="mb-4 rounded-2xl bg-ios-surface px-4 py-3 text-[12px] leading-relaxed text-ios-muted ring-1 ring-black/5 dark:ring-white/5">
        {browserReachHint('sailor')}
      </p>
      <h3 className="mb-3 px-1 text-[19px] font-bold">즐겨찾기</h3>
      <MarketLinks markets={listed} onNavigate={onNavigate} variant="grid" />

      <h3 className="mb-3 mt-8 px-1 text-[19px] font-bold">자주 방문한 사이트</h3>
      {recent.length === 0 ? (
        <p className="rounded-2xl bg-ios-surface px-4 py-6 text-center text-[13px] text-ios-muted ring-1 ring-black/5 dark:ring-white/5">
          아직 방문 기록이 없습니다.
        </p>
      ) : (
        <ul className="divide-y divide-ios-separator/15 overflow-hidden rounded-2xl bg-ios-surface ring-1 ring-black/5 dark:ring-white/5">
          {recent.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onNavigate(entry.url)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ios-accent/15 text-[13px] font-bold text-ios-accent">
                  {entry.title.slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px]">{entry.title}</span>
                  <span className="block truncate text-[11px] text-ios-muted">{entry.url}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
