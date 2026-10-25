import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Siren } from 'lucide-react';
import { ARTICLES } from '@/data/news';
import { formatAgo, getFeed, hasBreaking, type Article, type NewsCategory } from '@/game/news';
import { Pill, Segmented, type PillTone } from '@/components';
import { useGameStore } from '@/store/gameStore';
import { SPRING_SNAPPY, SPRING_SOFT, prefersReducedMotion } from '@/utils/motion';
import { AppShell } from '../AppShell';

type Filter = '전체' | NewsCategory;
const FILTERS: Filter[] = ['전체', '속보', '사회', '경제', '지역'];

const CATEGORY_TONE: Record<NewsCategory, PillTone> = {
  속보: 'red',
  사회: 'blue',
  경제: 'green',
  지역: 'orange',
};

/** 초선일보 — what is happening in 가온시; reacts to how hot things are. */
export function NewsApp() {
  const heat = useGameStore((s) => s.heat);
  const [filter, setFilter] = useState<Filter>('전체');
  const [open, setOpen] = useState<Article | null>(null);
  const reduced = prefersReducedMotion();

  const feed = useMemo(() => getFeed(ARTICLES, heat), [heat]);
  const visible = feed.filter((article) => filter === '전체' || article.category === filter);
  const breaking = hasBreaking(ARTICLES, heat);

  return (
    <div className="relative h-full overflow-hidden bg-ios-bg">
      <AppShell title="초선일보" largeTitle>
        {breaking ? (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING_SNAPPY}
            className="mx-4 mb-3 flex items-center gap-2 rounded-2xl bg-ios-red/15 px-3.5 py-2.5 text-[13px] font-medium text-ios-red"
          >
            <Siren className="size-4 shrink-0" aria-hidden />
            속보가 있습니다. 지역 단속 소식을 확인하세요.
          </motion.div>
        ) : null}

        <div className="px-4 pb-3">
          <Segmented
            options={FILTERS.map((item) => ({ value: item, label: item }))}
            value={filter}
            onChange={setFilter}
            layout="scroll"
          />
        </div>

        <ul className="space-y-3 px-4 pb-8">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((article) => (
              <motion.li
                key={article.id}
                layout={!reduced}
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, scale: 0.97 }}
                transition={SPRING_SNAPPY}
              >
                <button
                  type="button"
                  onClick={() => setOpen(article)}
                  className="w-full rounded-2xl bg-ios-surface p-4 text-left shadow-sm ring-1 ring-black/5 transition-transform active:scale-[0.985] dark:ring-white/5"
                >
                  <div className="flex items-center gap-2 text-[11px]">
                    <Pill tone={CATEGORY_TONE[article.category]}>{article.category}</Pill>
                    <span className="text-ios-muted">{formatAgo(article.hoursAgo)}</span>
                  </div>
                  <h3 className="mt-2 text-[16px] font-semibold leading-snug">{article.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ios-muted">{article.summary}</p>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
          {visible.length === 0 ? (
            <li className="py-16 text-center text-[14px] text-ios-muted">해당 분야의 기사가 없습니다.</li>
          ) : null}
        </ul>
      </AppShell>

      <AnimatePresence>
        {open ? (
          <motion.article
            key={open.id}
            className="absolute inset-0 z-20 flex flex-col bg-ios-bg"
            initial={reduced ? false : { x: '100%' }}
            animate={{ x: 0 }}
            exit={reduced ? undefined : { x: '100%' }}
            transition={SPRING_SOFT}
          >
            <header className="glass-strong shrink-0 border-b border-ios-separator/20 pt-[var(--ios-statusbar-h)]">
              <div className="flex h-[var(--ios-navbar-h)] items-center px-2">
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  className="flex h-11 items-center gap-0.5 rounded-xl pr-3 text-[16px] text-ios-accent active:opacity-60"
                  aria-label="목록으로"
                >
                  <ChevronLeft className="size-6" aria-hidden /> 뉴스
                </button>
              </div>
            </header>
            <div className="scroll-area no-scrollbar flex-1 px-5 pb-10 pt-4">
              <Pill tone={CATEGORY_TONE[open.category]}>{open.category}</Pill>
              <h1 className="mt-3 text-[24px] font-bold leading-tight tracking-tight">{open.title}</h1>
              <p className="mt-2 text-[12px] text-ios-muted">초선일보 · {formatAgo(open.hoursAgo)}</p>
              <div className="mt-5 space-y-4 text-[16px] leading-[1.7]">
                {open.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </motion.article>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
