import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, PackageSearch } from 'lucide-react';
import { PARCELS } from '@/data/parcels';
import { PARCEL_STATE_LABEL, parcelProgress, type Parcel, type ParcelState } from '@/game/parcels';
import { Pill, type PillTone } from '@/components';
import { useGameStore } from '@/store/gameStore';
import { SPRING_SNAPPY, SPRING_SOFT, prefersReducedMotion } from '@/utils/motion';
import { cn } from '@/utils/cn';
import { AppShell } from '../AppShell';

const STATE_TONE: Record<ParcelState, PillTone> = {
  moving: 'blue',
  delivered: 'green',
  delayed: 'orange',
  held: 'red',
};

/** 구팡 — parcel tracking whose status moves with the in-game clock. */
export function DeliveryApp() {
  const gameDateTime = useGameStore((s) => s.gameDateTime);
  const [open, setOpen] = useState<Parcel | null>(null);
  const reduced = prefersReducedMotion();

  const rows = useMemo(
    () => PARCELS.map((parcel) => ({ parcel, progress: parcelProgress(parcel, gameDateTime) })),
    [gameDateTime],
  );
  const active = rows.filter((row) => row.progress.state !== 'delivered');
  const done = rows.filter((row) => row.progress.state === 'delivered');
  const openProgress = open ? parcelProgress(open, gameDateTime) : null;

  const renderRow = ({ parcel, progress }: (typeof rows)[number], index: number) => (
    <motion.li
      key={parcel.id}
      layout={!reduced}
      initial={reduced ? false : { opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...SPRING_SNAPPY, delay: Math.min(index, 6) * 0.05 }}
    >
      <button
        type="button"
        onClick={() => setOpen(parcel)}
        className="flex w-full items-center gap-3 rounded-2xl bg-ios-surface p-4 text-left shadow-sm ring-1 ring-black/5 dark:ring-white/5"
      >
        <div className="min-w-0 flex-1">
          <Pill tone={STATE_TONE[progress.state]}>
            {PARCEL_STATE_LABEL[progress.state]}
          </Pill>
          <p className="mt-1.5 truncate text-[16px] font-semibold">{parcel.label}</p>
          <p className="mt-0.5 truncate text-[12px] text-ios-muted">
            {parcel.sender} · {parcel.trackingNo}
          </p>
          <p className="mt-1 text-[12px] text-ios-muted">
            {progress.stageIndex >= 0 ? parcel.stages[progress.stageIndex].label : '접수 대기'}
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-ios-muted" aria-hidden />
      </button>
    </motion.li>
  );

  return (
    <div className="relative h-full overflow-hidden bg-ios-bg">
      <AppShell title="구팡" largeTitle>
        <div className="px-4 pb-8">
          <h2 className="pb-2 pt-1 text-[13px] font-medium text-ios-muted">진행 중 {active.length}건</h2>
          <ul className="space-y-3">{active.map((row, index) => renderRow(row, index))}</ul>

          {done.length > 0 ? (
            <>
              <h2 className="pb-2 pt-6 text-[13px] font-medium text-ios-muted">배송 완료</h2>
              <ul className="space-y-3">{done.map((row, index) => renderRow(row, active.length + index))}</ul>
            </>
          ) : null}

          <p className="mt-6 flex items-center justify-center gap-1.5 text-[12px] text-ios-muted">
            <PackageSearch className="size-4" aria-hidden /> 배송 상태는 게임 속 시간에 따라 바뀝니다.
          </p>
        </div>
      </AppShell>

      <AnimatePresence>
        {open && openProgress ? (
          <motion.section
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
                  <ChevronLeft className="size-6" aria-hidden /> 배송
                </button>
              </div>
            </header>

            <div className="scroll-area no-scrollbar flex-1 px-5 pb-10 pt-4">
              <Pill tone={STATE_TONE[openProgress.state]}>
                {PARCEL_STATE_LABEL[openProgress.state]}
              </Pill>
              <h1 className="mt-2 text-[24px] font-bold tracking-tight">{open.label}</h1>
              <p className="mt-1 text-[13px] text-ios-muted">
                {open.sender} · {open.trackingNo}
              </p>

              {openProgress.state === 'held' ? (
                <p className="mt-4 rounded-2xl bg-ios-red/10 p-3.5 text-[13px] leading-relaxed text-ios-red">
                  물류센터에서 추가 확인이 필요해 배송이 보류되었습니다. 처리 일정은 아직 알 수 없습니다.
                </p>
              ) : null}
              {openProgress.state === 'delayed' ? (
                <p className="mt-4 rounded-2xl bg-ios-orange/10 p-3.5 text-[13px] leading-relaxed text-ios-orange">
                  물량 적체로 배송이 지연되고 있습니다.
                </p>
              ) : null}

              <ol className="mt-6">
                {open.stages.map((stage, index) => {
                  const reached = index <= openProgress.stageIndex;
                  const current = index === openProgress.stageIndex;
                  const isLast = index === open.stages.length - 1;
                  return (
                    <li key={stage.label} className="relative flex gap-4 pb-7 last:pb-0">
                      {!isLast ? (
                        <span
                          className={cn(
                            'absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-0.5',
                            index < openProgress.stageIndex ? 'bg-ios-accent' : 'bg-ios-separator/40',
                          )}
                          aria-hidden
                        />
                      ) : null}
                      <span
                        className={cn(
                          'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full ring-4 ring-ios-bg',
                          reached ? 'bg-ios-accent text-white' : 'bg-ios-surface text-ios-muted',
                          current && openProgress.state !== 'delivered' && 'animate-pulse',
                        )}
                      >
                        {reached ? <Check className="size-4" aria-hidden /> : <span className="size-1.5 rounded-full bg-ios-muted/50" />}
                      </span>
                      <div className="pt-0.5">
                        <p className={cn('text-[15px]', reached ? 'font-semibold' : 'text-ios-muted')}>{stage.label}</p>
                        {current && openProgress.state === 'held' ? (
                          <p className="mt-0.5 text-[12px] text-ios-red">이 단계에서 보류됨</p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
