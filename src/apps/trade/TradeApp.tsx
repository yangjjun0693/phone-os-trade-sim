import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRightLeft,
  Banknote,
  CalendarClock,
  Flame,
  Package,
  Target,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react';
import { npcs, places } from '@/data';
import {
  dealStats,
  dealTotal,
  findMeeting,
  formatDealEta,
  heatFromCash,
  heatLabel,
  heatTier,
  meetingOptions,
  patrolLabelOf,
  remainingMinutes,
} from '@/game';
import {
  MAX_DAYS,
  RETIRE_GOAL,
  createCustomerOffer,
  customerKindHint,
  totalWealth,
  type CustomerOffer,
  type DayReport,
} from '@/game/trade';
import { AnimatedNumber, Burst, Pill } from '@/components';
import { STORAGE_CAPACITY } from '@/content/economy';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/utils/cn';
import { formatCash } from '@/utils/format';
import { haptic } from '@/utils/haptics';
import { SPRING_BOUNCY, SPRING_SNAPPY, SPRING_SOFT, prefersReducedMotion } from '@/utils/motion';
import { AppShell } from '../AppShell';
import { EmptyState } from '../EmptyState';
import { Row, Section } from '../SectionList';

const tierColor: Record<ReturnType<typeof heatTier>, string> = {
  calm: 'text-ios-green',
  watched: 'text-ios-orange',
  hot: 'text-ios-red',
  burned: 'text-ios-red',
};

const tierBar: Record<ReturnType<typeof heatTier>, string> = {
  calm: 'bg-ios-green',
  watched: 'bg-ios-orange',
  hot: 'bg-ios-red',
  burned: 'bg-ios-red',
};

interface Feedback {
  tone: 'ok' | 'warn' | 'error';
  text: string;
}

export function TradeApp() {
  const cash = useGameStore((s) => s.cash);
  const heat = useGameStore((s) => s.heat);
  const day = useGameStore((s) => s.day);
  const inventory = useGameStore((s) => s.inventory);
  const bankBalance = useGameStore((s) => s.bank.balance);
  const status = useGameStore((s) => s.status);
  const lastReport = useGameStore((s) => s.lastReport);
  const stats = useGameStore((s) => s.stats);
  const sellToCustomer = useGameStore((s) => s.sellToCustomer);
  const endDay = useGameStore((s) => s.endDay);
  const addHeat = useGameStore((s) => s.addHeat);
  const advanceGameTime = useGameStore((s) => s.advanceGameTime);
  const deals = useGameStore((s) => s.deals);
  const trust = useGameStore((s) => s.trust);
  const gameDateTime = useGameStore((s) => s.gameDateTime);
  const fulfilDeal = useGameStore((s) => s.fulfilDeal);
  const cancelDeal = useGameStore((s) => s.cancelDeal);

  const [customer, setCustomer] = useState<CustomerOffer | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [celebration, setCelebration] = useState(false);

  const tier = heatTier(heat);
  const wealth = totalWealth(cash, bankBalance);
  const progress = Math.min(1, wealth / RETIRE_GOAL);
  const stockValue = inventory.reduce((sum, item) => sum + item.unitCost * item.qty, 0);
  const stockUnits = inventory.reduce((sum, item) => sum + item.qty, 0);
  const cashRisk = Math.ceil(heatFromCash(cash) / 2);

  const booked = deals.filter((deal) => deal.status === 'booked');
  const appointmentStats = dealStats(deals);
  const hour = new Date(gameDateTime).getHours();
  // Safety first, then the shortest walk.
  const meetSpots = meetingOptions(places, 'home', heat, hour);
  const spotsToShow = meetSpots.slice(0, 4);

  const chooseMeetPlace = useGameStore((s) => s.chooseMeetPlace);

  const runDeal = (dealId: string) => {
    const result = fulfilDeal(dealId);
    if (!result.ok) {
      haptic(12);
      setFeedback({ tone: 'error', text: result.error ?? '약속을 처리하지 못했습니다.' });
      return;
    }
    setFeedback({ tone: 'ok', text: result.message ?? '약속을 지켰습니다.' });
    haptic(8);
  };

  const dropDeal = (dealId: string) => {
    cancelDeal(dealId);
    setFeedback({ tone: 'warn', text: '약속을 취소했다. 신뢰가 조금 떨어졌다.' });
    haptic(10);
  };

  const callCustomer = () => {
    const next = createCustomerOffer(inventory, npcs, heat, Math.random, trust);
    if (!next) {
      haptic(12);
      setFeedback({
        tone: 'warn',
        text: '팔 재고가 없습니다. 브라우저에서 먼저 물건을 매입하세요.',
      });
      return;
    }
    setCustomer(next);
    setFeedback(null);
    advanceGameTime(5);
    haptic(6);
  };

  const handleSell = (action: 'accept' | 'counter') => {
    if (!customer) return;
    const result = sellToCustomer(customer, action);

    if (result.sting) {
      setCustomer(null);
      setFeedback({ tone: 'error', text: result.message ?? '잠복 근무자였습니다.' });
      haptic([12, 40, 12]);
      return;
    }

    if (!result.ok) {
      if (result.left) setCustomer(null);
      setFeedback({
        tone: 'warn',
        text: result.message ?? result.error ?? '거래가 성사되지 않았습니다.',
      });
      haptic(10);
      return;
    }

    setCustomer(null);
    setFeedback({ tone: 'ok', text: result.message ?? '거래를 마쳤습니다.' });
    setCelebration(true);
    window.setTimeout(() => setCelebration(false), 900);
    haptic(8);
  };

  const declineCustomer = () => {
    setCustomer(null);
    addHeat(1);
    advanceGameTime(5);
    setFeedback({
      tone: 'warn',
      text: '손님을 돌려보냈다. 소문이 조금 돌았다. (heat +1)',
    });
    haptic(6);
  };

  const closeDay = () => {
    const result = endDay();
    if (!result.ok) {
      setFeedback({ tone: 'error', text: result.error ?? '하루를 마감하지 못했습니다.' });
      return;
    }
    setCustomer(null);
    setFeedback(null);
    setReportOpen(true);
    haptic(10);
  };

  return (
    <div className="relative h-full">
      <AppShell
        title="거래"
        largeTitle
        trailing={
          <motion.span
            key={day}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={SPRING_BOUNCY}
            className="rounded-full bg-ios-separator/20 px-2 py-0.5 text-[11px] font-semibold text-ios-muted"
          >
            Day {day}
          </motion.span>
        }
      >
        <div className="mx-4 mb-6 grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING_SOFT}
            className="rounded-2xl bg-ios-surface p-3.5 shadow-sm ring-1 ring-black/5 dark:ring-white/5"
          >
            <p className="text-[12px] font-medium text-ios-muted">현금</p>
            <AnimatedNumber
              value={cash}
              format={formatCash}
              className="mt-1 block text-[22px] font-bold"
            />
            <p className="text-[11px] text-ios-muted">예금 {formatCash(bankBalance)}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_SOFT, delay: 0.04 }}
            className="relative overflow-hidden rounded-2xl bg-ios-surface p-3.5 shadow-sm ring-1 ring-black/5 dark:ring-white/5"
          >
            <p className="relative text-[12px] font-medium text-ios-muted">Heat</p>
            <AnimatedNumber
              value={heat}
              className={cn('relative mt-1 block text-[22px] font-bold', tierColor[tier])}
            />
            <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-ios-separator/25">
              <motion.div
                className={cn('h-full rounded-full', tierBar[tier])}
                initial={false}
                animate={{ width: `${Math.min(100, heat)}%` }}
                transition={SPRING_SOFT}
              />
            </div>
            <p className="relative mt-1 text-[11px] text-ios-muted">{heatLabel(tier)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_SOFT, delay: 0.08 }}
            className="col-span-2 rounded-2xl bg-ios-surface p-3.5 shadow-sm ring-1 ring-black/5 dark:ring-white/5"
          >
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[12px] font-medium text-ios-muted">
                <Target className="size-3.5" aria-hidden />
                은퇴 목표
              </p>
              <p className="text-[12px] font-semibold tabular-nums">
                {formatCash(wealth)} / {formatCash(RETIRE_GOAL)}
              </p>
            </div>
            <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-ios-separator/25">
              <motion.div
                className="relative h-full rounded-full bg-ios-accent"
                initial={false}
                animate={{ width: `${progress * 100}%` }}
                transition={SPRING_SOFT}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-ios-muted">
              <span>현금 + 예금</span>
              <span>
                Day {Math.min(day, MAX_DAYS)} / {MAX_DAYS}
              </span>
            </div>
          </motion.div>
        </div>

        <Section
          header="손님"
          footer="수락하면 바로 판매됩니다. 협상은 +18%를 부르지만 손님이 떠날 수 있습니다."
          delay={0.05}
        >
          {customer ? (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={SPRING_SOFT}
              className="relative overflow-hidden p-4"
            >
              <Burst show={celebration} radius={110} />
              <div className="flex items-start gap-3">
                <motion.span
                  initial={{ scale: 0.6, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={SPRING_BOUNCY}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ios-accent/10"
                >
                  <UserRound className="size-5 text-ios-accent" aria-hidden />
                </motion.span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[16px] font-semibold">{customer.name}</p>
                    <Pill tone={customer.kind === 'undercover' ? 'red' : customer.kind === 'difficult' ? 'orange' : 'green'}>
                      인내심 {customer.patience}
                    </Pill>
                  </div>
                  <p className="mt-0.5 text-[12px] text-ios-muted">
                    {customerKindHint(customer.kind)}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-ios-bg/60 px-3 py-2.5 ring-1 ring-black/5 dark:ring-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[14px]">
                    {customer.itemName} ×{customer.qty}
                  </span>
                  <span className="text-[16px] font-bold tabular-nums">
                    {formatCash(customer.total)}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-ios-muted">
                  개당 {formatCash(customer.unitPrice)} · 제안가
                </p>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSell('accept')}
                  className="flex h-10 items-center justify-center rounded-xl bg-ios-green text-[13px] font-semibold text-white active:opacity-80"
                >
                  수락
                </button>
                <button
                  type="button"
                  onClick={() => handleSell('counter')}
                  className="flex h-10 items-center justify-center gap-1 rounded-xl bg-ios-accent text-[13px] font-semibold text-white active:opacity-80"
                >
                  <ArrowRightLeft className="size-3.5" aria-hidden />
                  +18%
                </button>
                <button
                  type="button"
                  onClick={declineCustomer}
                  className="flex h-10 items-center justify-center rounded-xl bg-ios-separator/20 text-[13px] font-semibold text-ios-muted active:bg-ios-separator/30"
                >
                  거절
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={SPRING_SOFT}
              className="p-4"
            >
              <button
                type="button"
                onClick={callCustomer}
                disabled={status !== 'playing'}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ios-accent text-[15px] font-semibold text-white active:opacity-80 disabled:bg-ios-separator/20 disabled:text-ios-muted"
              >
                <UserRound className="size-4" aria-hidden />
                손님 받기
              </button>
              <p className="mt-2 text-center text-[12px] text-ios-muted">
                재고에서 무작위로 한 명이 찾아옵니다. 거절하면 heat +1.
              </p>
            </motion.div>
          )}
        </Section>

        <AnimatePresence>
          {feedback ? (
            <motion.div
              key={feedback.text}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={SPRING_SNAPPY}
              className={cn(
                'mx-4 mb-6 rounded-xl px-3 py-2 text-[12px]',
                feedback.tone === 'ok' && 'bg-ios-green/10 text-ios-green',
                feedback.tone === 'warn' && 'bg-ios-orange/10 text-ios-orange',
                feedback.tone === 'error' && 'bg-ios-red/10 text-ios-red',
              )}
              role="status"
            >
              {feedback.text}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <Section
          header="약속"
          footer={
            booked.length > 0
              ? `잡힌 약속 ${appointmentStats.booked}건 · 완료 ${appointmentStats.done} · 놓침 ${appointmentStats.missed}`
              : `완료 ${appointmentStats.done} · 놓침 ${appointmentStats.missed} · 약속은 메신저 답장으로 생깁니다.`
          }
          delay={0.08}
        >
          {booked.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="잡힌 약속이 없습니다"
              description="메신저에서 손님 제안에 답장하면 거래 앱에 약속이 뜹니다."
            />
          ) : (
            booked.map((deal) => {
              const npc = npcs.find((entry) => entry.id === deal.npcId);
              const stock = inventory
                .filter((item) => item.productId === deal.productId)
                .reduce((sum, item) => sum + item.qty, 0);
              const enough = stock >= deal.qty;
              const late = remainingMinutes(deal, gameDateTime) <= 0;
              return (
                <div
                  key={deal.id}
                  className="border-b border-ios-separator/15 px-4 py-3 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold">{npc?.name ?? '손님'}</span>
                    <Pill tone={late ? 'red' : 'blue'}>{formatDealEta(deal, gameDateTime)}</Pill>
                    <span className="ml-auto text-[15px] font-semibold tabular-nums">
                      {formatCash(dealTotal(deal))}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-ios-muted">
                    {deal.productName} ×{deal.qty} · 개당 {formatCash(deal.unitPrice)} · 보유 {stock}개
                  </p>

                  {/* Where to meet: safety vs. a shorter walk. */}
                  {(() => {
                    const chosen = findMeeting(meetSpots, deal.placeId);
                    return (
                      <div className="mt-2 rounded-xl bg-ios-bg/60 px-3 py-2 ring-1 ring-black/5 dark:ring-white/5">
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="font-medium">
                            만남 장소 {chosen ? `· ${chosen.name}` : '· 미정'}
                          </span>
                          {chosen ? (
                            <span className="text-ios-muted">
                              {patrolLabelOf(chosen.patrol)} · 이동 {chosen.tripMinutes}분
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {spotsToShow.map((option) => {
                            const active = option.placeId === deal.placeId;
                            return (
                              <button
                                key={option.placeId}
                                type="button"
                                onClick={() => chooseMeetPlace(deal.id, option.placeId)}
                                aria-pressed={active}
                                className={cn(
                                  'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium',
                                  active
                                    ? 'bg-ios-accent text-white'
                                    : option.patrol === 'high'
                                      ? 'bg-ios-red/15 text-ios-red'
                                      : option.patrol === 'mid'
                                        ? 'bg-ios-orange/15 text-ios-orange'
                                        : 'bg-ios-green/15 text-ios-green',
                                )}
                              >
                                {option.name} · {option.tripMinutes}분
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={!enough || status !== 'playing'}
                      onClick={() => runDeal(deal.id)}
                      className="flex h-9 items-center justify-center rounded-xl bg-ios-green text-[13px] font-semibold text-white disabled:bg-ios-separator/20 disabled:text-ios-muted"
                    >
                      {enough ? '약속 이행' : '재고 부족'}
                    </button>
                    <button
                      type="button"
                      onClick={() => dropDeal(deal.id)}
                      className="flex h-9 items-center justify-center rounded-xl bg-ios-separator/20 text-[13px] font-semibold text-ios-muted"
                    >
                      약속 취소
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </Section>

        <Section
          header="재고"
          footer={
            inventory.length
              ? `재고 원가 ${formatCash(stockValue)} · 보관 ${stockUnits}/${STORAGE_CAPACITY}${
                  stockUnits > STORAGE_CAPACITY
                    ? ' · 초과분은 마감 때 heat와 압수 위험이 커집니다'
                    : ''
                }`
              : '브라우저에서 매입하면 배송을 거쳐 여기로 들어옵니다.'
          }
          delay={0.1}
        >
          {inventory.length === 0 ? (
            <EmptyState
              icon={Package}
              title="재고가 없습니다"
              description="브라우저를 열고 암시장에서 첫 물량을 주문하세요."
            />
          ) : (
            inventory.map((item, index) => (
              <Row
                key={item.id}
                animateIn={index}
                icon={<Package className="size-4 text-ios-muted" />}
                title={item.name}
                subtitle={`원가 ${formatCash(item.unitCost)}${
                  item.marketPrice ? ` · 시세 ${formatCash(item.marketPrice)}` : ''
                }`}
                value={`×${item.qty}`}
              />
            ))
          )}
        </Section>

        <Section
          header="하루 마감"
          footer="마감하면 하루 지출(월세 일할+생활비)이 빠지고, 사건이 하나 일어나며, heat가 크게 식습니다. 현금을 많이 들고 있으면 추가 heat가 붙습니다."
          delay={0.15}
        >
          <div className="p-4">
            <div className="mb-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-ios-bg/60 py-2 ring-1 ring-black/5 dark:ring-white/5">
                <p className="text-[11px] text-ios-muted">판매</p>
                <p className="text-[15px] font-semibold tabular-nums">{stats.sales}</p>
              </div>
              <div className="rounded-xl bg-ios-bg/60 py-2 ring-1 ring-black/5 dark:ring-white/5">
                <p className="text-[11px] text-ios-muted">매출</p>
                <p className="text-[15px] font-semibold tabular-nums">
                  {formatCash(stats.revenue)}
                </p>
              </div>
              <div className="rounded-xl bg-ios-bg/60 py-2 ring-1 ring-black/5 dark:ring-white/5">
                <p className="text-[11px] text-ios-muted">잠복</p>
                <p className="text-[15px] font-semibold tabular-nums">{stats.stings}</p>
              </div>
            </div>
            <p className="mb-3 text-center text-[11px] text-ios-muted">
              현금 보관 위험: 마감 시 +{cashRisk} heat · 예금으로 줄일 수 있습니다.
            </p>
            <button
              type="button"
              onClick={closeDay}
              disabled={status !== 'playing'}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ios-surface font-semibold ring-1 ring-black/10 active:bg-ios-separator/10 disabled:opacity-50 dark:ring-white/10"
            >
              <Banknote className="size-4 text-ios-accent" aria-hidden />
              하루 마감하고 다음 날로
            </button>
          </div>
        </Section>

        <p className="px-4 pb-8 text-center text-[11px] text-ios-muted">
          <TrendingUp className="mr-1 inline size-3 align-[-2px]" aria-hidden />
          전부 허구의 게임 시스템입니다.
          <Flame className="ml-1 inline size-3 align-[-2px]" aria-hidden />
        </p>
      </AppShell>

      <AnimatePresence>
        {reportOpen && lastReport ? (
          <DayReportSheet
            report={lastReport}
            onClose={() => setReportOpen(false)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function DayReportSheet({ report, onClose }: { report: DayReport; onClose: () => void }) {
  const reduced = prefersReducedMotion();
  const heatDelta = report.heatAfter - report.heatBefore;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 z-50 flex items-end bg-black/45"
    >
      <motion.div
        initial={reduced ? undefined : { y: 60 }}
        animate={{ y: 0 }}
        exit={reduced ? undefined : { y: 60 }}
        transition={SPRING_SNAPPY}
        className="w-full rounded-t-[28px] bg-ios-bg p-5 pb-8 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-medium text-ios-muted">Day {report.day} 마감</p>
            <h2 className="mt-0.5 text-[22px] font-bold">오늘의 정산</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-ios-separator/20 text-ios-muted"
            aria-label="닫기"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-2 rounded-2xl bg-ios-surface p-3.5 ring-1 ring-black/5 dark:ring-white/5">
          <ReportLine
            label="하루 지출"
            value={`-${formatCash(report.rent)}`}
            detail={
              report.paidFromBank > 0
                ? `현금 ${formatCash(report.paidFromCash)} · 예금 ${formatCash(report.paidFromBank)}`
                : `현금 ${formatCash(report.paidFromCash)}`
            }
          />
          <ReportLine
            label="Heat"
            value={`${heatDelta >= 0 ? '+' : ''}${heatDelta}`}
            detail={`${report.heatBefore} → ${report.heatAfter}`}
            tone={heatDelta > 0 ? 'bad' : 'good'}
          />
          <ReportLine
            label="현금"
            value={formatCash(report.cashAfter)}
            detail={`${formatCash(report.cashBefore)} → ${formatCash(report.cashAfter)}`}
          />
          <ReportLine
            label="총 재산"
            value={formatCash(report.totalWealth)}
            detail={`예금 ${formatCash(report.bankAfter)}`}
          />
          {report.runnerIncome > 0 || report.runnersCaught.length > 0 ? (
            <ReportLine
              label="러너"
              value={report.runnerIncome > 0 ? `+${formatCash(report.runnerIncome)}` : '—'}
              detail={
                report.runnersCaught.length > 0
                  ? `${report.runnersCaught.length}명 적발 · heat·신뢰 손실`
                  : '자동 판매 수익'
              }
              tone={report.runnerIncome > 0 ? 'good' : 'bad'}
            />
          ) : null}
          {report.raidLost > 0 ? (
            <ReportLine
              label="압수"
              value={`-${report.raidLost}개`}
              detail={`보관 초과로 재고를 잃었습니다 (보관 ${report.stockUnits}개)`}
              tone="bad"
            />
          ) : null}
        </div>

        {report.event ? (
          <div className="mt-3 rounded-2xl bg-ios-orange/10 p-3.5 text-ios-orange">
            <p className="text-[13px] font-semibold">{report.event.title}</p>
            <p className="mt-1 text-[12px] opacity-90">{report.event.description}</p>
            <p className="mt-1 text-[11px] opacity-80">
              heat {report.event.heatDelta >= 0 ? '+' : ''}
              {report.event.heatDelta} · 현금 {report.event.cashDelta >= 0 ? '+' : ''}
              {formatCash(report.event.cashDelta)}
            </p>
          </div>
        ) : (
          <div className="mt-3 rounded-2xl bg-ios-surface p-3.5 ring-1 ring-black/5 dark:ring-white/5">
            <p className="text-[13px] font-semibold">조용한 하루</p>
            <p className="mt-1 text-[12px] text-ios-muted">
              특별한 사건 없이 밤이 지나갔다. 가끔은 그게 최고다.
            </p>
          </div>
        )}

        {report.unpaidRent > 0 ? (
          <p className="mt-3 text-[12px] text-ios-red">
            월세 {formatCash(report.unpaidRent)}을 내지 못했습니다. heat가 올랐습니다.
          </p>
        ) : null}

        {report.status !== 'playing' ? (
          <p className="mt-3 text-[12px] font-medium text-ios-red">{report.reason}</p>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-ios-accent text-[15px] font-semibold text-white active:opacity-80"
        >
          {report.status === 'playing' ? '계속' : '결과 보기'}
        </button>
      </motion.div>
    </motion.div>
  );
}

function ReportLine({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: 'good' | 'bad';
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[14px]">{label}</p>
        {detail ? <p className="text-[11px] text-ios-muted">{detail}</p> : null}
      </div>
      <p
        className={cn(
          'shrink-0 text-[15px] font-semibold tabular-nums',
          tone === 'good' && 'text-ios-green',
          tone === 'bad' && 'text-ios-red',
        )}
      >
        {value}
      </p>
    </div>
  );
}
