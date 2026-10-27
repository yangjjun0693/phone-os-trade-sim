import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Play,
  SkipForward,
  Sparkles,
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

/** Sits above the dock (icons are 60px, plus padding and the home bar). */
const GUIDE_BOTTOM = 'calc(108px + env(safe-area-inset-bottom, 0px))';

/**
 * The play guide. It is deliberately **not** a lock: it floats above the home
 * screen only, never covers an app, and every step is detected from the game
 * save rather than intercepting taps. The player can quit it from Settings and
 * pick it up again later.
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

  const [open, setOpen] = useState(false);
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

  if (!setupDone || !active) return null;

  const targetAppId = step ? stepAppId(step, identity) : undefined;
  const targetApp = targetAppId ? getApp(targetAppId) : undefined;

  const goalText = (() => {
    if (!step) return null;
    if (step.goal.type === 'openApp') return '앱을 열면 완료됩니다.';
    const value = Math.min(snapshot[step.goal.metric] ?? 0, step.goal.target);
    return `${TUTORIAL_METRIC_LABELS[step.goal.metric]} ${value} / ${step.goal.target}`;
  })();

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
    <div
      className="pointer-events-none absolute inset-x-0 z-[42] flex flex-col items-center gap-2 px-4"
      style={{ bottom: GUIDE_BOTTOM }}
      data-tutorial-guide={active ? 'on' : 'off'}
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

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="card"
            initial={reduced ? undefined : { opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: 14, scale: 0.98 }}
            transition={reduced ? { duration: 0.01 } : SPRING_SOFT}
            className="surface-card pointer-events-auto max-h-[52vh] w-full max-w-[360px] overflow-y-auto rounded-[26px] p-4 text-ios-text"
            role="dialog"
            aria-label="플레이 가이드"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-ios-muted">
                가이드
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

            <div className="mt-2 h-1 overflow-hidden rounded-full bg-ios-separator/15" aria-hidden>
              <motion.div
                className="h-full rounded-full bg-app"
                animate={{ width: `${allDone ? 100 : progress.percent}%` }}
                transition={SPRING_SOFT}
              />
            </div>

            {allDone ? (
              <div className="pt-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-ios-green/15 text-ios-green">
                    <Check className="size-4" aria-hidden />
                  </span>
                  <p className="text-[18px] font-semibold">가이드 완료</p>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-ios-muted">
                  {TUTORIAL_STEPS.length}단계를 모두 둘러봤습니다. 이제 즐기면 됩니다. 가이드는
                  설정에서 언제든 다시 볼 수 있습니다.
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
                <p className="text-[17px] font-semibold leading-snug">{step.title}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ios-muted">{step.text}</p>

                <div className="mt-3 flex items-center gap-2 text-[12px] text-ios-muted">
                  {targetApp ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-ios-separator/15 px-2 py-1 font-medium">
                      <targetApp.icon className="size-3.5" aria-hidden />
                      {targetApp.name}
                    </span>
                  ) : null}
                  {goalText ? <span className="tabular-nums">{goalText}</span> : null}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={handleOpenApp}
                    disabled={!targetAppId}
                    className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-app text-[14px] font-semibold text-white active:opacity-80 disabled:opacity-40"
                  >
                    <Play className="size-4" aria-hidden />
                    앱 열기
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

      <motion.button
        type="button"
        layout
        whileTap={reduced ? undefined : { scale: 0.96 }}
        transition={SPRING_BOUNCY}
        onClick={() => {
          haptic(5);
          setOpen((value) => !value);
        }}
        aria-expanded={open}
        aria-label={open ? '가이드 접기' : '가이드 펼치기'}
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
        {!allDone ? (
          <span className="shrink-0 text-[11px] tabular-nums text-ios-muted">
            {Math.min(done.length + 1, progress.total)}/{progress.total}
          </span>
        ) : null}
        <ChevronDown
          className={cn('size-4 shrink-0 text-ios-muted transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </motion.button>

      {/* First-run hint: the pill is easy to miss while looking at the icons. */}
      <AnimatePresence>
        {!open && done.length === 0 ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_IOS }}
            className="wallpaper-ink flex items-center gap-1 text-[11px] font-semibold"
          >
            <Sparkles className="size-3" aria-hidden />
            여기를 눌러 가이드를 펼치세요
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
