import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BookOpen,
  Check,
  ExternalLink,
  Globe,
  Package,
  Play,
  RefreshCw,
  Search,
  Store,
  WifiOff,
} from 'lucide-react';
import { clues, markets } from '@/data';
import { BROWSER_SITES } from '@/content/sites';
import {
  describeStatus,
  reachLabel,
  searchAll,
  siteKindLabel,
  suspicionScore,
  type AccessReason,
  type BrowserId,
} from '@/game';
import { useGameStore } from '@/store/gameStore';
import { Pill, type PillTone } from '@/components';
import { cn } from '@/utils/cn';
import { formatCash } from '@/utils/format';
import { SPRING_BOUNCY, fadeUp, staggerContainer } from '@/utils/motion';
import type {
  BrowserSite,
  ClassifiedsListing,
  MarketSite,
  MarketStatus,
  VideoItem,
  WikiArticle,
} from '@/types';
import { MarketOffers } from './MarketOffers';
import { marketUrl, searchQueryFromUrl, searchUrl, type BrowserTab } from './browserData';

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

/** Everyday-site shortcuts, shown under the market list on every start page. */
export function SiteLinks({
  sites,
  onNavigate,
}: {
  sites: BrowserSite[];
  onNavigate: (url: string) => void;
}) {
  if (sites.length === 0) return null;

  return (
    <motion.div
      variants={staggerContainer(0.05)}
      initial="hidden"
      animate="show"
      className="grid grid-cols-4 gap-x-3 gap-y-4 px-4"
    >
      {sites.map((site) => (
        <motion.button
          key={site.id}
          type="button"
          variants={fadeUp}
          onClick={() => onNavigate(site.url)}
          className="flex flex-col items-center gap-1.5"
        >
          <span
            className="flex size-14 items-center justify-center rounded-2xl text-[19px] font-bold text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5"
            style={{ backgroundColor: site.accent }}
            aria-hidden
          >
            {site.name.slice(0, 1)}
          </span>
          <span className="w-full truncate text-center text-[11px] text-ios-muted">
            {site.name}
          </span>
        </motion.button>
      ))}
    </motion.div>
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
  // Clues learned on everyday sites (videos, wiki, listings) join the pool.
  const learnedClues = useGameStore((s) => s.learnedClues);
  const score = suspicionScore(market, [...clues, ...learnedClues]);

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

/** Small shared chrome for everyday sites: brand bar, clue/trap notes. */
function SiteHeader({ site }: { site: BrowserSite }) {
  return (
    <div
      className="mb-3 flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-white"
      style={{ background: `linear-gradient(135deg, ${site.accent}, ${site.accent}cc)` }}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-[15px] font-bold">
        {site.name.slice(0, 1)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[16px] font-bold">{site.name}</span>
        <span className="block truncate text-[11px] opacity-85">{site.tagline}</span>
      </span>
    </div>
  );
}

function ClueNote({ text }: { text: string }) {
  return (
    <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-ios-green/12 px-2.5 py-1.5 text-[12px] text-ios-green">
      <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      단서를 얻었습니다 — {text}
    </p>
  );
}

function TrapNote({ note }: { note: string }) {
  return (
    <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-ios-red/12 px-2.5 py-1.5 text-[12px] text-ios-red">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      {note}
    </p>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-2xl bg-ios-surface p-4 ring-1 ring-black/5 dark:ring-white/5">
      {children}
    </div>
  );
}

/** ViewTube: watch a clip to move the game clock; some clips teach or bite. */
function VideoSite({ site }: { site: Extract<BrowserSite, { kind: 'video' }> }) {
  const advanceGameTime = useGameStore((s) => s.advanceGameTime);
  const learnClue = useGameStore((s) => s.learnClue);
  const handleTrap = useGameStore((s) => s.handleTrap);
  const recordSiteActivity = useGameStore((s) => s.recordSiteActivity);
  const learnedClues = useGameStore((s) => s.learnedClues);
  const handledTraps = useGameStore((s) => s.handledTraps);
  const [flash, setFlash] = useState<string | null>(null);

  const watch = (video: VideoItem) => {
    advanceGameTime(video.lengthMin);
    recordSiteActivity('video');
    if (video.clue) learnClue(video.clue);
    setFlash(`${video.lengthMin}분이 흘렀습니다.`);
    window.setTimeout(() => setFlash(null), 2600);
  };

  return (
    <div className="p-4">
      <SiteHeader site={site} />
      <p className="mb-3 rounded-xl bg-ios-surface px-3 py-2 text-[12px] text-ios-muted ring-1 ring-black/5 dark:ring-white/5">
        영상을 보면 <b>게임 시간이 그만큼 흐릅니다</b>. 배송·메시지를 기다릴 때 쓰세요.
        (보상은 없습니다)
      </p>
      {flash ? (
        <p className="mb-3 rounded-xl bg-ios-accent/12 px-3 py-2 text-center text-[13px] font-medium text-ios-accent">
          {flash}
        </p>
      ) : null}

      {site.videos.map((video) => {
        const hasClue = video.clue ? learnedClues.some((c) => c.id === video.clue!.id) : false;
        const trapDone = handledTraps.includes(video.id);
        return (
          <Card key={video.id}>
            <div className="flex gap-3">
              <span
                className="flex size-16 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ background: `linear-gradient(135deg, ${site.accent}, ${site.accent}bb)` }}
                aria-hidden
              >
                <Play className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold leading-snug">{video.title}</p>
                <p className="mt-0.5 text-[11px] text-ios-muted">
                  {video.channel} · {video.views} · {video.lengthMin}분
                </p>
              </div>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-ios-muted">{video.description}</p>

            <button
              type="button"
              onClick={() => watch(video)}
              className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-ios-text px-3 text-[13px] font-semibold text-ios-bg"
            >
              <Play className="size-3.5" aria-hidden /> 시청 · {video.lengthMin}분 흐름
            </button>

            {video.trap ? (
              trapDone ? (
                <TrapNote note={video.trap.note} />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    handleTrap(video.id, { cash: video.trap?.cash, heat: video.trap?.heat });
                  }}
                  className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-ios-red/12 px-3 text-[13px] font-semibold text-ios-red"
                >
                  <ExternalLink className="size-3.5" aria-hidden /> 설명란 링크 열기
                </button>
              )
            ) : null}

            {hasClue && video.clue ? <ClueNote text={video.clue.text} /> : null}
          </Card>
        );
      })}
    </div>
  );
}

/** Sleuth: the working search box over everyday sites and known markets. */
function SearchSite({
  site,
  query,
  browser,
  onNavigate,
}: {
  site: Extract<BrowserSite, { kind: 'search' }>;
  query: string;
  browser: BrowserId;
  onNavigate: (url: string) => void;
}) {
  const discovered = useGameStore((s) => s.discoveredMarkets);
  const recordSiteActivity = useGameStore((s) => s.recordSiteActivity);
  const [value, setValue] = useState(query);
  const results = searchAll(query, BROWSER_SITES, markets, browser, discovered);
  const hasResults = results.sites.length + results.markets.length > 0;

  useEffect(() => {
    if (query.trim()) recordSiteActivity('search');
  }, [query, recordSiteActivity]);

  return (
    <div className="p-4">
      <SiteHeader site={site} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const next = value.trim();
          if (next) onNavigate(searchUrl(next));
        }}
        className="flex items-center gap-2 rounded-full bg-ios-surface px-3 py-2 ring-1 ring-black/5 dark:ring-white/5"
      >
        <Search className="size-4 shrink-0 text-ios-muted" aria-hidden />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-label="검색어"
          placeholder="사이트나 마켓 이름을 검색하세요"
          className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ios-muted"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-ios-accent px-3 py-1 text-[13px] font-semibold text-white"
        >
          검색
        </button>
      </form>

      {!query.trim() ? (
        <p className="mt-6 text-center text-[13px] text-ios-muted">
          검색어를 입력하세요. 아직 찾지 못한 .onion 주소는 결과에 나오지 않습니다.
        </p>
      ) : !hasResults ? (
        <p className="mt-6 rounded-2xl bg-ios-surface px-4 py-6 text-center text-[13px] text-ios-muted ring-1 ring-black/5 dark:ring-white/5">
          “{query}”에 대한 결과가 없습니다.
        </p>
      ) : (
        <>
          {results.sites.length > 0 ? (
            <>
              <h3 className="mb-2 mt-5 px-1 text-[12px] font-medium text-ios-muted">일상 사이트</h3>
              <ul className="divide-y divide-ios-separator/15 overflow-hidden rounded-2xl bg-ios-surface ring-1 ring-black/5 dark:ring-white/5">
                {results.sites.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(entry.url)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left"
                    >
                      <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold text-white"
                        style={{ backgroundColor: entry.accent }}
                        aria-hidden
                      >
                        {entry.name.slice(0, 1)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px]">{entry.name}</span>
                        <span className="mt-0.5 block truncate text-[12px] text-ios-muted">
                          {siteKindLabel(entry.kind)} · {entry.tagline}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {results.markets.length > 0 ? (
            <>
              <h3 className="mb-2 mt-5 px-1 text-[12px] font-medium text-ios-muted">마켓</h3>
              <ul className="divide-y divide-ios-separator/15 overflow-hidden rounded-2xl bg-ios-surface ring-1 ring-black/5 dark:ring-white/5">
                {results.markets.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(marketUrl(entry.id))}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left"
                    >
                      <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold text-white"
                        style={{ backgroundColor: entry.accent }}
                        aria-hidden
                      >
                        {entry.name.slice(0, 1)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[15px]">{entry.name}</span>
                          <Pill tone={REACH_TONE[entry.reach]} className="shrink-0">
                            {reachLabel(entry.reach)}
                          </Pill>
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-ios-muted">
                          {entry.tagline}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}

/** 중고마을: used-goods listings. Browse-only — traps and clues still fire. */
function ClassifiedsSite({ site }: { site: Extract<BrowserSite, { kind: 'classifieds' }> }) {
  const handleTrap = useGameStore((s) => s.handleTrap);
  const learnClue = useGameStore((s) => s.learnClue);
  const handledTraps = useGameStore((s) => s.handledTraps);
  const learnedClues = useGameStore((s) => s.learnedClues);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="p-4">
      <SiteHeader site={site} />
      <p className="mb-3 rounded-xl bg-ios-surface px-3 py-2 text-[12px] text-ios-muted ring-1 ring-black/5 dark:ring-white/5">
        지금은 <b>둘러보기만</b> 됩니다. 문의는 가능하지만 매입은 준비 중입니다.
      </p>

      {site.listings.map((listing: ClassifiedsListing) => {
        const open = openId === listing.id;
        const trapDone = handledTraps.includes(listing.id);
        const clueKnown = listing.clue
          ? learnedClues.some((c) => c.id === listing.clue!.id)
          : false;
        return (
          <Card key={listing.id}>
            <div className="flex items-start gap-2">
              <Store className="mt-0.5 size-4 shrink-0 text-ios-muted" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold leading-snug">{listing.title}</p>
                <p className="mt-0.5 text-[12px] text-ios-muted">
                  {listing.seller} · {formatCash(listing.price)}
                </p>
              </div>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-ios-muted">{listing.blurb}</p>

            <button
              type="button"
              onClick={() => {
                setOpenId(open ? null : listing.id);
                if (!open && listing.clue) learnClue(listing.clue);
              }}
              className="mt-3 flex h-9 w-full items-center justify-center rounded-xl bg-ios-surface2 px-3 text-[13px] font-semibold text-ios-text"
            >
              {open ? '접기' : '자세히 보기'}
            </button>

            {open && listing.trap ? (
              trapDone ? (
                <TrapNote note={listing.trap.note} />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    handleTrap(listing.id, { cash: listing.trap?.cash, heat: listing.trap?.heat });
                  }}
                  className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-ios-red/12 px-3 text-[13px] font-semibold text-ios-red"
                >
                  <ExternalLink className="size-3.5" aria-hidden /> 선입금하고 문의하기
                </button>
              )
            ) : null}

            {open && clueKnown && listing.clue ? <ClueNote text={listing.clue.text} /> : null}
          </Card>
        );
      })}
    </div>
  );
}

/** OpenPedia: a reference that can hand out an onion address. */
function WikiSite({ site }: { site: Extract<BrowserSite, { kind: 'wiki' }> }) {
  const learnClue = useGameStore((s) => s.learnClue);
  const discoverMarket = useGameStore((s) => s.discoverMarket);
  const recordSiteActivity = useGameStore((s) => s.recordSiteActivity);
  const learnedClues = useGameStore((s) => s.learnedClues);
  const discovered = useGameStore((s) => s.discoveredMarkets);
  const [openId, setOpenId] = useState<string | null>(null);

  const article = site.articles.find((entry) => entry.id === openId) ?? null;

  if (article) {
    return (
      <div className="p-4">
        <button
          type="button"
          onClick={() => setOpenId(null)}
          className="mb-3 text-[13px] font-medium text-ios-accent"
        >
          ‹ 목록으로
        </button>
        <h2 className="text-[19px] font-bold">{article.title}</h2>
        <p className="mt-1 text-[12px] text-ios-muted">{article.category} 문서</p>
        <div className="mt-3 space-y-2">
          {article.body.map((line, i) => (
            <p key={i} className="text-[14px] leading-relaxed">
              {line}
            </p>
          ))}
        </div>
        {article.clue && learnedClues.some((c) => c.id === article.clue!.id) ? (
          <ClueNote text={article.clue.text} />
        ) : null}
        {article.unlockId && discovered.includes(article.unlockId) ? (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-ios-purple/12 px-3 py-2 text-[12px] text-ios-purple">
            <BookOpen className="size-3.5 shrink-0" aria-hidden />
            새 주소를 알게 되었습니다. 브라우저 주소 목록에서 확인하세요.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="p-4">
      <SiteHeader site={site} />
      <p className="mb-3 rounded-xl bg-ios-surface px-3 py-2 text-[12px] text-ios-muted ring-1 ring-black/5 dark:ring-white/5">
        문서를 읽으면 게임 시스템을 알 수 있고, 일부 문서는 <b>주소를 알려줍니다</b>.
      </p>
      <ul className="divide-y divide-ios-separator/15 overflow-hidden rounded-2xl bg-ios-surface ring-1 ring-black/5 dark:ring-white/5">
        {site.articles.map((entry: WikiArticle) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => {
                setOpenId(entry.id);
                recordSiteActivity('wiki');
                if (entry.clue) learnClue(entry.clue);
                if (entry.unlockId) discoverMarket(entry.unlockId);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <BookOpen className="size-4 shrink-0 text-ios-accent" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px]">{entry.title}</span>
                <span className="mt-0.5 block truncate text-[12px] text-ios-muted">
                  {entry.category}
                </span>
              </span>
              <span className="shrink-0 text-ios-separator" aria-hidden>
                ›
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SitePage({
  site,
  query,
  browser,
  onNavigate,
}: {
  site: BrowserSite;
  query: string;
  browser: BrowserId;
  onNavigate: (url: string) => void;
}) {
  switch (site.kind) {
    case 'search':
      return <SearchSite site={site} query={query} browser={browser} onNavigate={onNavigate} />;
    case 'video':
      return <VideoSite site={site} />;
    case 'classifieds':
      return <ClassifiedsSite site={site} />;
    case 'wiki':
      return <WikiSite site={site} />;
  }
}

/** The rendered "website" inside any browser chrome. */
export function SiteView({
  tab,
  browser,
  onNavigate,
  className,
}: {
  tab: BrowserTab;
  browser: BrowserId;
  onNavigate: (url: string) => void;
  className?: string;
}) {
  const market = tab.marketId ? markets.find((entry) => entry.id === tab.marketId) : null;
  const site = tab.siteId ? BROWSER_SITES.find((entry) => entry.id === tab.siteId) : null;

  return (
    <div className={cn('min-h-full bg-ios-bg text-ios-text', className)}>
      {market ? (
        <MarketPage market={market} />
      ) : site ? (
        <SitePage
          site={site}
          query={searchQueryFromUrl(tab.url)}
          browser={browser}
          onNavigate={onNavigate}
        />
      ) : (
        <GenericPage tab={tab} />
      )}
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
