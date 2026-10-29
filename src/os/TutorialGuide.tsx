import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Play,
  SkipForward,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { TUTORIAL_METRIC_LABELS, TUTORIAL_STEPS } from '@/content/tutorial';
import {
  isTutorialStepComplete,
  stepAppId,
  tutorialProgress,
  type TutorialSnapshot,
} from '@/game/tutorial';
import { getApp } from '@/apps/registry';
import { useGameStore } from '@/store/gameStore';
import { useOSStore } from '@/store/osStore';
import { useTutorialStore } from '@/store/tutorialStore';
import { cn } from '@/utils/cn';
import { haptic } from '@/utils/haptics';
import { EASE_IOS, SPRING_BOUNCY, SPRING_SOFT, prefersReducedMotion } from '@/utils/motion';

/** Where the collapsed pill sits: above the dock, clear of the home bar. */
const GUIDE_BOTTOM = 108;
/** Top of the card when it takes the upper slot (clear of the status bar). */
const CARD_TOP = 64;
/**
 * Room kept below the card when it takes the lower slot. The card replaces the
 * pill while it is open, so this only has to clear the home bar.
 */
const CARD_BOTTOM = 56;
/** Breathing room between the card and the icon it must not cover. */
const CARD_GAP = 14;
/** Vertical space a card needs before it is worth measuring the real height. */
const ASSUMED_CARD_HEIGHT = 300;

interface Layout {
  spot: { x: number; y: number; w: number; h: number };
  /** Slot the card takes so the highlighted icon stays visible. */
  place: 'top' | 'bottom';
  maxHeight: number;
}

/**
 * The play guide. It is deliberately **not** a lock: it floats above the home
 * screen only, never covers an app, and every step is detected from the game
 * save rather than intercepting taps. The player can quit it from Settings and
 * pick it up again later.
 *
 * Opening the card does two things:
 *  - it dims the home screen and keeps a hole over the app the step points at,
 *    so the highlighted icon is obvious instead of hidden behind the card;
 *  - it measures that icon and takes the opposite slot (top/bottom), capping
 *    its own height to the free space, so the icon is *never* covered.
 *
 * Completion is watched through read-only selectors; when the current step's
 * goal is met the card ticks itself off, flashes a short confirmation and moves
 * on. Steps can also be skipped by hand, because a tutorial should never trap
 * anyone.
 */
export function TutorialGuide() {
  const reduced = prefersReducedMotion();
  const active = useTutorialStore((s) => s.active);
  const setupDone = useTutorialStore((s) => s.setupDone);
  const stepIndex = useTutorialStore((s) => s.stepIndex);
  const done = useTutorialStore((s) => s.done);
  const openedApps = useTutorialStore((s) => s.openedApps);
  const identity = useTutorialStore((s) => s.defaultIdentity);
  const completeStep = useTutorialStore((s) => s.completeStep);
  const goToStep = useTutorialStore((s) => s.goToStep);
  const stopGuide = useTutorialStore((s) => s.stopGuide);
  const restartGuide = useTutorialStore((s) => s.restartGuide);
  const openApp = useOSStore((s) => s.openApp);

  const inventory = useGameStore((s) => s.inventory.reduce((sum, item) => sum + item.qty, 0));
  const shipments = useGameStore((s) => s.shipments.length);
  const markets = useGameStore((s) => s.discoveredMarkets.length);
  const replies = useGameStore((s) => s.inbox.filter((message) => message.status === 'answered').length);
  const sales = useGameStore((s) => s.stats.sales);
  const bankTransactions = useGameStore((s) => s.bank.transactions.length);
  const day = useGameStore((s) => s.day);

  // A brand-new player gets the first step already open; after that the guide
  // stays a pill until they ask for it.
  const [open, setOpen] = useState(() => stepIndex === 0 && done.length === 0);
  const [flash, setFlash] = useState<string | null>(null);

  const snapshot = useMemo<TutorialSnapshot>(
    () => ({
      openedApps,
      inventory,
      shipments,
      markets,
      replies,
      sales,
      bankTransactions,
      day,
    }),
    [openedApps, inventory, shipments, markets, replies, sales, bankTransactions, day],
  );

  const step = TUTORIAL_STEPS[stepIndex];
  const progress = tutorialProgress(done, TUTORIAL_STEPS.length);
  const allDone = TUTORIAL_STEPS.every((item) => done.includes(item.id));
  const targetAppId = step ? stepAppId(step, identity) : undefined;
  const targetApp = targetAppId ? getApp(targetAppId) : null;

  /** Tick the current step off as soon as the game reaches its goal. */
  useEffect(() => {
    if (!active || !step || done.includes(step.id)) return;
    if (!isTutorialStepComplete(step, snapshot, identity)) return;
    const timer = window.setTimeout(() => {
      completeStep(step.id);
      setFlash(step.title);
      haptic(14);
    }, reduced ? 0 : 420);
    return () => window.clearTimeout(timer);
  }, [active, step, done, snapshot, identity, completeStep, reduced]);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 2200);
    return () => window.clearTimeout(timer);
  }, [flash]);

  /**
   * Measure the highlighted icon against the OS box (not the browser window —
   * on desktop the phone is inset), then give the card the slot where it fits
   * *without* covering that icon. The card's own height drives the decision, so
   * a long step never pushes the card over the icon it is pointing at.
   */
  const cardRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  useLayoutEffect(() => {
    if (!open || !targetAppId) {
      setLayout(null);
      return;
    }
    const measure = () => {
      const root = document.querySelector('[data-os-root]');
      const icon = document.querySelector<HTMLElement>(`[data-app-id="${targetAppId}"]`);
      if (!root || !icon) {
        setLayout(null);
        return;
      }
      const box = icon.getBoundingClientRect();
      const frame = root.getBoundingClientRect();
      if (!box.width || !frame.height) {
        setLayout(null);
        return;
      }
      const spot = { x: box.left - frame.left, y: box.top - frame.top, w: box.width, h: box.height };
      const natural = cardRef.current?.scrollHeight || ASSUMED_CARD_HEIGHT;
      const freeBelow = frame.height - CARD_BOTTOM - (spot.y + spot.h) - CARD_GAP * 2;
      const freeAbove = spot.y - CARD_TOP - CARD_GAP * 2;
      const place: Layout['place'] =
        freeBelow >= natural ? 'bottom' : freeAbove >= natural ? 'top' : freeAbove > freeBelow ? 'top' : 'bottom';
      const free = Math.max(place === 'bottom' ? freeBelow : freeAbove, 0);
      setLayout((previous) => {
        const maxHeight = Math.max(168, Math.min(natural, free, frame.height * 0.78));
        if (
          previous &&
          previous.place === place &&
          Math.abs(previous.maxHeight - maxHeight) < 2 &&
          previous.spot.y === spot.y &&
          previous.spot.x === spot.x
        ) {
          return previous;
        }
        return { spot, place, maxHeight };
      });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open, targetAppId, stepIndex, done.length, allDone]);

  if (!setupDone || !active) return null;

  const goalLabel = (() => {
    if (!step) return null;
    if (step.goal.type === 'openApp') return '앱을 열면 완료';
    const value = Math.min(snapshot[step.goal.metric] ?? 0, step.goal.target);
    return `${TUTORIAL_METRIC_LABELS[step.goal.metric]} ${value} / ${step.goal.target}`;
  })();
  const goalMet = step ? isTutorialStepComplete(step, snapshot, identity) : false;

  const handleOpenApp = () => {
    if (!targetAppId) return;
    haptic(8);
    setOpen(false);
    targetApp?.preload?.();
    openApp(targetAppId);
  };

  const handleSkipStep = () => {
    if (!step) return;
    haptic(6);
    completeStep(step.id);
  };

  return (
    <>
      {/* Spotlight: dims the home screen and leaves the target icon in a hole. */}
      {open && layout ? (
        <div className="pointer-events-none absolute inset-0 z-[43]" aria-hidden>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22, ease: EASE_IOS }}
            className="absolute rounded-[26%]"
            style={{
              left: layout.spot.x - CARD_GAP,
              top: layout.spot.y - CARD_GAP,
              width: layout.spot.w + CARD_GAP * 2,
              height: layout.spot.h + CARD_GAP * 2,
              boxShadow: '0 0 0 9999px rgb(4 6 12 / 0.52)',
            }}
          />
          <motion.span
            className="absolute flex size-7 items-center justify-center rounded-full bg-white text-ios-text shadow-[0_6px_16px_-4px_rgba(0,0,0,0.5)]"
            style={{
              left: layout.spot.x + layout.spot.w / 2 - 14,
              top: layout.place === 'bottom' ? layout.spot.y + layout.spot.h + 4 : layout.spot.y - 32,
            }}
            animate={reduced ? undefined : { y: layout.place === 'bottom' ? [0, 5, 0] : [0, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {layout.place === 'bottom' ? (
              <ChevronUp className="size-4" aria-hidden />
            ) : (
              <ChevronDown className="size-4" aria-hidden />
            )}
          </motion.span>
        </div>
      ) : null}

      {/* The card takes the slot opposite the icon; height is capped to fit. */}
      <div
        className="pointer-events-none absolute inset-x-0 z-[44] flex justify-center px-4"
        style={
          layout?.place === 'top'
            ? { top: CARD_TOP, maxHeight: layout.maxHeight }
            : { bottom: GUIDE_BOTTOM, maxHeight: layout?.maxHeight }
        }
      >
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              key="card"
              ref={cardRef}
              initial={reduced ? undefined : { opacity: 0, y: layout?.place === 'top' ? -16 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: layout?.place === 'top' ? -12 : 14 }}
              transition={reduced ? { duration: 0.01 } : SPRING_SOFT}
              className="surface-card pointer-events-auto w-full max-w-[360px] overflow-y-auto rounded-[26px] p-4 text-ios-text"
              role="dialog"
              aria-label="플레이 가이드"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-ios-muted">
                  플레이 가이드
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold tabular-nums text-ios-muted">
                    {allDone ? '완료' : `${Math.min(done.length + 1, progress.total)} / ${progress.total}`}
                  </span>
                  <button
                    type="button"
                    aria-label="가이드 카드 접기"
                    onClick={() => {
                      haptic(4);
                      setOpen(false);
                    }}
                    className="flex size-7 items-center justify-center rounded-full bg-ios-separator/15 text-ios-text"
                  >
                    <ChevronDown className="size-4" aria-hidden />
                  </button>
                </div>
              </div>

              {/* One segment per step: done, current, todo. */}
              <div className="mt-2.5 flex gap-1" aria-hidden>
                {TUTORIAL_STEPS.map((item, index) => (
                  <span
                    key={item.id}
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition-colors',
                      done.includes(item.id)
                        ? 'bg-ios-green'
                        : index === stepIndex && !allDone
                          ? 'bg-app'
                          : 'bg-ios-separator/20',
                    )}
                  />
                ))}
              </div>

              {allDone ? (
                <div className="pt-4">
                  <div className="flex items-center gap-2">
                    <motion.span
                      initial={reduced ? undefined : { scale: 0.6 }}
                      animate={{ scale: 1 }}
                      transition={SPRING_BOUNCY}
                      className="flex size-9 items-center justify-center rounded-full bg-ios-green/15 text-ios-green"
                    >
                      <Check className="size-4" aria-hidden />
                    </motion.span>
                    <div>
                      <p className="text-[18px] font-semibold leading-tight">가이드 완료</p>
                      <p className="text-[12px] text-ios-muted">
                        {TUTORIAL_STEPS.length}단계 · 모든 앱을 한 번씩 둘러봤습니다
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-ios-muted">
                    이제는 자유롭게 하루를 굴리면 됩니다. 가이드는 설정에서 언제든 다시 볼 수 있습니다.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        haptic(6);
                        restartGuide();
                        setOpen(true);
                      }}
                      className="flex h-10 flex-1 items-center justify-center rounded-xl bg-app text-[14px] font-semibold text-white active:opacity-80"
                    >
                      처음부터 다시
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        haptic(4);
                        stopGuide();
                        setOpen(false);
                      }}
                      className="flex h-10 flex-1 items-center justify-center rounded-xl bg-ios-separator/15 text-[14px] font-semibold text-ios-text"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              ) : step ? (
                <div className="pt-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-app text-[11px] font-bold text-white tabular-nums">
                      {done.length + 1}
                    </span>
                    <p className="text-[17px] font-semibold leading-snug">{step.title}</p>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-ios-muted">{step.text}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
                    {targetApp ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-ios-separator/15 px-2 py-1 font-medium text-ios-text">
                        <targetApp.icon className="size-3.5" aria-hidden />
                        {targetApp.name}
                      </span>
                    ) : null}
                    {goalLabel ? (
                      <span
                        className={cn(
                          'flex items-center gap-1.5 rounded-full px-2 py-1 font-medium tabular-nums',
                          goalMet
                            ? 'bg-ios-green/15 text-ios-green'
                            : 'bg-ios-separator/15 text-ios-muted',
                        )}
                      >
                        {goalMet ? (
                          <Check className="size-3.5" aria-hidden />
                        ) : (
                          <Target className="size-3.5" aria-hidden />
                        )}
                        {goalLabel}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={handleOpenApp}
                      disabled={!targetAppId}
                      className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-app text-[14px] font-semibold text-white active:opacity-80 disabled:opacity-40"
                    >
                      <Play className="size-4" aria-hidden />
                      {targetApp ? `${targetApp.name} 열기` : '앱 열기'}
                    </button>
                    <button
                      type="button"
                      aria-label="이전 단계"
                      onClick={() => {
                        haptic(4);
                        goToStep(stepIndex - 1);
                      }}
                      disabled={stepIndex === 0}
                      className="flex size-10 items-center justify-center rounded-xl bg-ios-separator/15 text-ios-text disabled:opacity-30"
                    >
                      <ArrowLeft className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label="이 단계 건너뛰기"
                      onClick={handleSkipStep}
                      className="flex size-10 items-center justify-center rounded-xl bg-ios-separator/15 text-ios-text"
                    >
                      <SkipForward className="size-4" aria-hidden />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      haptic(4);
                      stopGuide();
                      setOpen(false);
                    }}
                    className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-[12px] font-medium text-ios-muted"
                  >
                    <X className="size-3.5" aria-hidden />
                    그만 보기 (설정에서 다시 켤 수 있음)
                  </button>
                </div>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/*
        Confirmation toast. It keeps to the side the card does not occupy, so
        the tick that says "step done" never lands on the buttons.
      */}
      <div
        className="pointer-events-none absolute inset-x-0 z-[46] flex justify-center px-4"
        style={
          open
            ? layout?.place === 'top'
              ? { bottom: CARD_TOP }
              : { top: CARD_TOP }
            : { bottom: GUIDE_BOTTOM + 48 }
        }
      >
        <AnimatePresence>
          {flash ? (
            <motion.p
              key={flash}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={SPRING_SOFT}
              className="flex items-center gap-1.5 rounded-full bg-ios-green px-3 py-1.5 text-[12px] font-semibold text-white shadow-lg"
            >
              <Check className="size-3.5" aria-hidden />
              완료 · {flash}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      {/*
        Collapsed pill. It steps aside while the card is open — the card already
        shows the same step and carries its own collapse button, and dropping it
        gives the card the room to sit above the home bar instead of over the
        widgets.
      */}
      <div
        className="pointer-events-none absolute inset-x-0 z-[45] flex flex-col items-center gap-2 px-4"
        style={{ bottom: GUIDE_BOTTOM }}
      >
        <AnimatePresence>
          {!open ? (
            <motion.button
              key="pill"
              type="button"
              initial={reduced ? undefined : { opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
              whileTap={reduced ? undefined : { scale: 0.96 }}
              transition={SPRING_BOUNCY}
              onClick={() => {
                haptic(5);
                setOpen(true);
              }}
              aria-haspopup="dialog"
              aria-label="가이드 펼치기"
              className="glass-strong pointer-events-auto flex h-10 max-w-[86%] items-center gap-2 rounded-full pl-1.5 pr-3 text-ios-text shadow-[0_16px_36px_-20px_rgba(0,0,0,0.65)] ring-1 ring-inset ring-white/40 dark:ring-white/10"
            >
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white',
                  allDone ? 'bg-ios-green' : 'bg-app',
                )}
              >
                {allDone ? (
                  <Check className="size-3.5" aria-hidden />
                ) : (
                  <span className="tabular-nums">{Math.min(done.length + 1, progress.total)}</span>
                )}
              </span>
              <span className="truncate text-[13px] font-semibold">
                {allDone ? '가이드 완료' : (step?.title ?? '가이드')}
              </span>
              <Sparkles className="size-3 shrink-0 text-ios-muted" aria-hidden />
              <ChevronUp className="size-4 shrink-0 text-ios-muted" aria-hidden />
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  );
}
