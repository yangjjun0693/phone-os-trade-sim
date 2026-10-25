import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Package, RefreshCw, Search, WifiOff } from 'lucide-react';
import { clues, markets } from '@/data';
import { describeStatus, reachLabel, suspicionScore, type AccessReason, type BrowserId } from '@/game';
import { Pill, type PillTone } from '@/components';
import { cn } from '@/utils/cn';
import { SPRING_BOUNCY, fadeUp, staggerContainer } from '@/utils/motion';
import type { MarketSite, MarketStatus } from '@/types';
import { MarketOffers } from './MarketOffers';
import { marketUrl, type BrowserTab } from './browserData';

export const STATUS_TONE: Record<MarketStatus, PillTone> = {
  legit: 'green',
  scam: 'red',
  honeypot: 'red',
  closing: 'orange',
};

const REACH_TONE = { clearnet: 'neutral', mirror: 'orange', onion: 'purple' } as const;

/** The market link list shown on every browser's start page / favourites. */
export function MarketLinks({
  markets,
  onNavigate,
  variant = 'list',
}: {
  markets: MarketSite[];
  onNavigate: (url: string) => void;
  variant?: 'list' | 'grid';
}) {
  if (markets.length === 0) {
    return (
      <p className="rounded-2xl bg-ios-surface px-4 py-6 text-center text-[13px] text-ios-muted ring-1 ring-black/5 dark:ring-white/5">
        접속할 수 있는 사이트가 없습니다. 소셜 앱에서 주소를 알아내세요.
      </p>
    );
  }

  if (variant === 'grid') {
    return (
      <motion.div
        variants={staggerContainer(0.05)}
        initial="hidden"
        animate="show"
        className="grid grid-cols-4 gap-x-3 gap-y-4 px-4"
      >
        {markets.map((market) => (
          <motion.button
            key={market.id}
            type="button"
            variants={fadeUp}
            onClick={() => onNavigate(marketUrl(market.id))}
            className="flex flex-col items-center gap-1.5"
          >
            <span className="flex size-14 items-center justify-center rounded-2xl bg-ios-surface text-[19px] font-bold text-ios-accent shadow-sm ring-1 ring-black/5 dark:ring-white/5">
              {market.name.slice(0, 1)}
            </span>
            <span className="w-full truncate text-center text-[11px] text-ios-muted">
              {market.name}
            </span>
          </motion.button>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.ul
      variants={staggerContainer(0.05)}
      initial="hidden"
      animate="show"
      className="divide-y divide-ios-separator/15 overflow-hidden rounded-2xl bg-ios-surface ring-1 ring-black/5 dark:ring-white/5"
    >
      {markets.map((market) => (
        <motion.li key={market.id} variants={fadeUp}>
          <button
            type="button"
            onClick={() => onNavigate(marketUrl(market.id))}
            className="flex w-full items-center gap-3 px-4 py-3 text-left"
          >
            <Search className="size-4 shrink-0 text-ios-accent" aria-hidden />
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold text-white"
              style={{ backgroundColor: market.accent }}
              aria-hidden
            >
              {market.name.slice(0, 1)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-[15px]">{market.name}</span>
                <Pill tone={REACH_TONE[market.reach]} className="shrink-0">
                  {reachLabel(market.reach)}
                </Pill>
              </span>
              <span className="mt-0.5 block truncate text-[12px] text-ios-muted">
                {market.tagline}
              </span>
            </span>
            <span className="shrink-0 text-ios-separator" aria-hidden>
              ›
            </span>
          </button>
        </motion.li>
      ))}
    </motion.ul>
  );
}

/** Explains how this browser is priced / traced for the site being viewed. */
export function ReachBanner({ market }: { market: MarketSite }) {
  const fee = Math.round((market.priceMod - 1) * 100);
  const detail =
    market.reach === 'clearnet'
      ? '일반 상점 · 소량만 판매 · 결제 기록이 남습니다'
      : market.reach === 'mirror'
        ? `미러 사이트 · 수수료 ${fee}% · 방문 기록이 남습니다`
        : '다크넷 원본 · 도매 물량 · 최저가';

  return (
    <div className="mb-3 flex items-center gap-2 rounded-xl bg-ios-surface px-3 py-2 text-[12px] text-ios-muted ring-1 ring-black/5 dark:ring-white/5">
      <Pill tone={REACH_TONE[market.reach]}>{reachLabel(market.reach)}</Pill>
      <span className="min-w-0 flex-1">{detail}</span>
    </div>
  );
}

function MarketPage({ market }: { market: MarketSite }) {
  const score = suspicionScore(market, clues);

  return (
    <div className="p-4">
      <ReachBanner market={market} />

      {/* Each market keeps its own brand colour, like a real shop front. */}
      <div
        className="mb-3 flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-white"
        style={{ background: `linear-gradient(135deg, ${market.accent}, ${market.accent}cc)` }}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-[15px] font-bold">
          {market.name.slice(0, 1)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[16px] font-bold">{market.name}</span>
          <span className="block truncate text-[11px] opacity-85">{market.tagline}</span>
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-ios-surface p-4 ring-1 ring-black/5 dark:ring-white/5">
        <p className="text-[12px] font-medium text-ios-muted">단서 (일부는 노이즈입니다)</p>
        <motion.ul
          variants={staggerContainer(0.06)}
          initial="hidden"
          animate="show"
          className="mt-2 space-y-1.5"
        >
          {market.traits.map((trait) => (
            <motion.li key={trait} variants={fadeUp} className="text-[14px]">
              • {trait}
            </motion.li>
          ))}
        </motion.ul>
        <div className="mt-3 flex items-center gap-2 text-[12px] text-ios-muted">
          <span>의심도 {score}/100</span>
          <Pill tone={STATUS_TONE[market.status]}>{describeStatus(market.status)}</Pill>
        </div>
      </div>

      <MarketOffers market={market} />
    </div>
  );
}

function GenericPage({ tab }: { tab: BrowserTab }) {
  return (
    <div className="p-6 text-center">
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-ios-surface ring-1 ring-black/5 dark:ring-white/5">
        <Globe className="size-7 text-ios-muted" aria-hidden />
      </div>
      <h2 className="text-[20px] font-bold">{tab.title}</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-ios-muted">
        이 사이트는 게임 안의 허구 콘텐츠입니다. 실제 서비스나 실제 방법을 다루지 않습니다.
      </p>
      <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ios-surface px-3 py-1 text-[12px] text-ios-muted ring-1 ring-black/5 dark:ring-white/5">
        <Package className="size-3.5" aria-hidden />
        {tab.url}
      </p>
    </div>
  );
}

/** The rendered "website" inside any browser chrome. */
export function SiteView({ tab, className }: { tab: BrowserTab; className?: string }) {
  const market = tab.marketId ? markets.find((entry) => entry.id === tab.marketId) : null;

  return (
    <div className={cn('min-h-full bg-ios-bg text-ios-text', className)}>
      {market ? <MarketPage market={market} /> : <GenericPage tab={tab} />}
    </div>
  );
}

/**
 * The browser-specific "this site will not open" page. Each browser gets its
 * own personality: Chroma has an offline dino, Sailor a server error, Shade a
 * failed-circuit retry.
 */
export function BlockedPage({
  browser,
  reason,
  url,
  onRetry,
}: {
  browser: BrowserId;
  reason: AccessReason;
  url: string;
  onRetry?: () => void;
}) {
  if (browser === 'chroma') return <ChromaOffline url={url} />;
  if (browser === 'sailor') return <SailorError onRetry={onRetry} />;
  return <TorError reason={reason} onRetry={onRetry} />;
}

/** Chroma: the classic offline page, with a tap-to-hop dinosaur. */
function ChromaOffline({ url }: { url: string }) {
  const [jumps, setJumps] = useState(0);
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-white px-8 py-16 text-center dark:bg-[#202124]">
      <motion.button
        type="button"
        onClick={() => setJumps((value) => value + 1)}
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 0.5 }}
        key={jumps}
        aria-label="점프"
        className="text-[#5f6368] dark:text-[#9aa0a6]"
      >
        <svg viewBox="0 0 44 32" className="size-16" aria-hidden>
          <path
            fill="currentColor"
            d="M2 30h4v-6h4v6h2V18h4v-2h2v-2h2V8h6V4h4v4h4v6h2v4h2v4h2v8h-4v-2h-2v2h-6v-2h-2v2H4v-2H2z"
          />
        </svg>
      </motion.button>
      <h2 className="text-[19px] font-semibold">연결할 수 없음</h2>
      <p className="max-w-[280px] text-[13px] leading-relaxed text-[#5f6368] dark:text-[#9aa0a6]">
        Chroma는 일반 인터넷만 열 수 있습니다. .onion 주소는 이 네트워크로 라우팅되지
        않습니다.
      </p>
      <p className="text-[11px] text-[#80868b]">ERR_TUNNEL_CONNECTION_FAILED</p>
      <p className="max-w-[280px] truncate rounded-full bg-[#f1f3f4] px-3 py-1 text-[11px] text-[#5f6368] dark:bg-[#35363a] dark:text-[#9aa0a6]">
        {url}
      </p>
    </div>
  );
}

/** Sailor: iOS-style "cannot open the page". */
function SailorError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-ios-bg px-8 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-ios-surface ring-1 ring-black/5 dark:ring-white/5">
        <WifiOff className="size-7 text-ios-muted" aria-hidden />
      </span>
      <h2 className="text-[19px] font-semibold">서버를 찾을 수 없습니다</h2>
      <p className="max-w-[280px] text-[13px] leading-relaxed text-ios-muted">
        Sailor는 미러 사이트까지만 접속됩니다. 원본 .onion 주소는 열리지 않습니다.
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="flex h-10 items-center gap-2 rounded-xl bg-ios-accent px-4 text-[14px] font-semibold text-white"
        >
          <RefreshCw className="size-4" aria-hidden /> 다시 시도
        </button>
      ) : null}
    </div>
  );
}

/** Shade: relay / invite failure with a fresh-circuit retry. */
function TorError({ reason, onRetry }: { reason: AccessReason; onRetry?: () => void }) {
  const invite = reason === 'invite-required';
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-[#20123a] px-8 py-16 text-center text-[#f0e9f6]">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-[#2b2a33] ring-1 ring-white/10">
        <RefreshCw className="size-7 text-[#c08ad8]" aria-hidden />
      </span>
      <h2 className="text-[19px] font-semibold">
        {invite ? '초대가 필요합니다' : '회로를 만들 수 없습니다'}
      </h2>
      <p className="max-w-[280px] text-[13px] leading-relaxed text-[#b9b2c6]">
        {invite
          ? '이 사이트는 초대 코드가 있는 사람만 열 수 있습니다. 커뮤니티에서 코드를 찾아보세요.'
          : '릴레이가 응답하지 않습니다. 새 회로를 만들어 다시 시도하세요.'}
      </p>
      {onRetry ? (
        <motion.button
          type="button"
          onClick={onRetry}
          whileTap={{ scale: 0.97 }}
          transition={SPRING_BOUNCY}
          className="flex h-10 items-center gap-2 rounded-xl bg-[#7d4698] px-4 text-[14px] font-semibold text-white"
        >
          <RefreshCw className="size-4" aria-hidden /> 새 회로로 다시 시도
        </motion.button>
      ) : null}
    </div>
  );
}
