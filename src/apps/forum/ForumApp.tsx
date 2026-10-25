import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, KeyRound, MessagesSquare, TriangleAlert, Zap } from 'lucide-react';
import { FORUM_THREADS, type ForumThread } from '@/content/forum';
import { Pill, Segmented, type PillTone } from '@/components';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/utils/cn';
import { SPRING_SNAPPY, SPRING_SOFT, fadeUp, staggerContainer } from '@/utils/motion';
import { AppShell } from '../AppShell';
import { Section } from '../SectionList';

type Tab = 'hot' | 'new';

const TAG_TONE: Record<ForumThread['tag'], PillTone> = {
  인텔: 'blue',
  질문: 'neutral',
  경고: 'red',
  구인: 'orange',
};

export function ForumApp() {
  const [tab, setTab] = useState<Tab>('hot');
  const [open, setOpen] = useState<ForumThread | null>(null);
  const [reward, setReward] = useState<string | null>(null);
  const discoverMarket = useGameStore((s) => s.discoverMarket);
  const discovered = useGameStore((s) => s.discoveredMarkets);

  const threads = useMemo(
    () => [...FORUM_THREADS].sort((a, b) => (tab === 'new' ? a.hoursAgo - b.hoursAgo : 0)),
    [tab],
  );

  const read = (thread: ForumThread) => {
    setOpen(thread);
    if (thread.discovers && !discovered.includes(thread.discovers)) {
      discoverMarket(thread.discovers);
      setReward(thread.reward ?? '새 주소를 알게 되었습니다.');
      window.setTimeout(() => setReward(null), 3000);
    }
  };

  const known = (thread: ForumThread) =>
    Boolean(thread.discovers && discovered.includes(thread.discovers));

  return (
    <div className="relative h-full overflow-hidden bg-ios-bg">
      <AppShell title="포럼" largeTitle>
        <div className="px-4 pb-4">
          <Segmented
            options={[
              { value: 'hot', label: '인기' },
              { value: 'new', label: '최신' },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        <AnimatePresence>
          {reward ? (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={SPRING_SNAPPY}
              className="mx-4 mb-3 flex items-center justify-center gap-1.5 rounded-xl bg-ios-green/15 px-3 py-2 text-[12px] font-medium text-ios-green"
            >
              <KeyRound className="size-3.5" aria-hidden /> {reward}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <Section header="최근 글" footer="주소·평판은 여기서 얻습니다. 일부는 노이즈입니다." delay={0.05}>
          <motion.ul
            variants={staggerContainer(0.05)}
            initial="hidden"
            animate="show"
            className="divide-y divide-ios-separator/15"
          >
            {threads.map((thread) => (
              <motion.li key={thread.id} variants={fadeUp}>
                <button
                  type="button"
                  onClick={() => read(thread)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left"
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-ios-purple/15">
                    <MessagesSquare className="size-4 text-ios-purple" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <Pill tone={TAG_TONE[thread.tag]} className="shrink-0">
                        {thread.tag}
                      </Pill>
                      {thread.noise ? (
                        <Pill tone="yellow" className="shrink-0">
                          의심
                        </Pill>
                      ) : null}
                      {known(thread) ? (
                        <Pill tone="green" className="shrink-0">
                          주소 확보
                        </Pill>
                      ) : null}
                    </span>
                    <span className="mt-1 block truncate text-[15px] font-semibold">
                      {thread.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-ios-muted">
                      {thread.author} · {thread.hoursAgo}시간 전
                    </span>
                  </span>
                </button>
              </motion.li>
            ))}
          </motion.ul>
        </Section>

        <p className="px-4 pb-8 text-center text-[11px] text-ios-muted">
          게임 속 가짜 포럼입니다. 실제 서비스나 실제 방법을 다루지 않습니다.
        </p>
      </AppShell>

      <AnimatePresence>
        {open ? (
          <motion.article
            key={open.id}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={SPRING_SOFT}
            className="absolute inset-0 z-30 flex flex-col bg-ios-bg"
          >
            <header className="glass-strong shrink-0 border-b border-ios-separator/20 pt-[var(--ios-statusbar-h)]">
              <div className="flex h-[var(--ios-navbar-h)] items-center px-2">
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  className="flex h-11 items-center gap-0.5 rounded-xl pr-3 text-[16px] text-ios-accent"
                  aria-label="목록으로"
                >
                  <ChevronLeft className="size-6" aria-hidden /> 포럼
                </button>
              </div>
            </header>

            <div className="scroll-area no-scrollbar flex-1 px-5 pb-10 pt-4">
              <div className="flex items-center gap-1.5">
                <Pill tone={TAG_TONE[open.tag]}>{open.tag}</Pill>
                {open.noise ? <Pill tone="yellow">의심</Pill> : null}
              </div>
              <h1 className="mt-3 text-[22px] font-bold leading-tight">{open.title}</h1>
              <p className="mt-2 text-[12px] text-ios-muted">
                {open.author} · {open.hoursAgo}시간 전
              </p>

              <div className="mt-5 space-y-3 text-[15px] leading-[1.7]">
                {open.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              {open.noise ? (
                <p className="mt-5 flex items-start gap-2 rounded-2xl bg-ios-yellow/15 p-3.5 text-[13px] leading-relaxed text-ios-yellow">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  다른 글과 맞지 않는 주장입니다. 그대로 믿지 마세요.
                </p>
              ) : null}

              {open.discovers ? (
                <p
                  className={cn(
                    'mt-5 flex items-center gap-2 rounded-2xl p-3.5 text-[13px]',
                    known(open)
                      ? 'bg-ios-green/15 text-ios-green'
                      : 'bg-ios-accent/15 text-ios-accent',
                  )}
                >
                  <Zap className="size-4 shrink-0" aria-hidden />
                  {known(open) ? '이미 알고 있는 주소입니다.' : (open.reward ?? '새 주소를 알게 됩니다.')}
                </p>
              ) : null}
            </div>
          </motion.article>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
