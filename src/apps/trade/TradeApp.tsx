import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRightLeft,
  CalendarClock,
  Flame,
  Package,
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
import { Burst, Pill } from '@/components';
import { STORAGE_CAPACITY } from '@/content/economy';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/utils/cn';
import { formatCash } from '@/utils/format';
import { haptic } from '@/utils/haptics';
import { SPRING_SNAPPY, SPRING_SOFT, prefersReducedMotion } from '@/utils/motion';
import { AppShell } from '../AppShell';
import { EmptyState } from '../EmptyState';
import { Row } from '../SectionList';

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

/** One ruled line of the running tally: label left, figure right. */
function Tally({
  label,
  children,
  strong,
}: {
  label: string;
  children: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-ios-separator/10 py-2 last:border-b-0">
      <span className="text-[13px] text-ios-muted">{label}</span>
      <span
        className={cn(
          'tabular-nums',
          strong ? 'text-[19px] font-semibold' : 'text-[15px] font-medium',
        )}
      >
        {children}
      </span>
    </div>
  );
}

/** A ruled group: a small label, a hairline, then rows. No card, no shadow. */
function Group({
  label,
  trailing,
  children,
  footer,
}: {
  label: string;
  trailing?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="mt-6 border-t border-ios-separator/15">
      <div className="flex items-center justify-between px-4 pb-1.5 pt-3">
        <h2 className="text-[12px] font-semibold text-ios-muted">{label}</h2>
        {trailing}
      </div>
      <div className="border-t border-ios-separator/10">{children}</div>
      {footer ? <p className="px-4 pt-2 text-[12px] text-ios-muted">{footer}</p> : null}
    </section>
  );
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
          <span className="text-[13px] font-medium tabular-nums text-ios-muted">
            Day {day}
          </span>
        }
      >
        {/* The tally: cash, deposit, total, goal. Ruled lines, money on the right. */}
        <div className="px-4 pt-1">
          <Tally label="현금" strong>
            {formatCash(cash)}
          </Tally>
          <Tally label="예금">{formatCash(bankBalance)}</Tally>
          <Tally label="합계">
            {formatCash(wealth)} / {formatCash(RETIRE_GOAL)}
          </Tally>
        </div>

        <div className="px-4 pb-1 pt-3">
          <div className="h-px w-full bg-ios-separator/25">
            <motion.div
              className="h-px bg-ios-text/70"
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={SPRING_SOFT}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-ios-muted">
            Day {Math.min(day, MAX_DAYS)} / {MAX_DAYS} · 목표의 {Math.round(progress * 100)}%
          </p>
        </div>

        {/* Heat as a warning strip, not a card. */}
        <div className="flex items-center gap-3 border-y border-ios-separator/15 px-4 py-2.5">
          <span className="text-[13px] text-ios-muted">노출도</span>
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-ios-separator/20">
            <motion.div
              className={cn('h-full', tierBar[tier])}
              initial={false}
              animate={{ width: `${Math.min(100, heat)}%` }}
              transition={SPRING_SOFT}
            />
          </div>
          <span
            className={cn('text-[13px] font-semibold tabular-nums', tierColor[tier])}
          >
            {heat}
          </span>
          <span className="w-12 text-right text-[11px] text-ios-muted">{heatLabel(tier)}</span>
        </div>

        <Group
          label="손님"
          footer={
            customer
              ? '수락하면 바로 판매됩니다. 협상은 +18%를 부르지만 손님이 떠날 수 있습니다.'
              : '재고에서 한 명이 찾아옵니다. 거절하면 노출도 +1.'
          }
        >
          {customer ? (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={SPRING_SOFT}
              className="relative overflow-hidden px-4 py-3"
            >
              <Burst show={celebration} radius={110} />
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[16px] font-semibold">{customer.name}</span>
                <Pill
                  tone={
                    customer.kind === 'undercover'
                      ? 'red'
                      : customer.kind === 'difficult'
                        ? 'orange'
                        : 'green'
                  }
                >
                  인내심 {customer.patience}
                </Pill>
              </div>
              <p className="mt-0.5 text-[12px] text-ios-muted">{customerKindHint(customer.kind)}</p>

              <div className="mt-2 flex items-baseline justify-between border-t border-ios-separator/10 pt-2">
                <span className="text-[14px]">
                  {customer.itemName} ×{customer.qty}
                </span>
                <span className="text-[17px] font-semibold tabular-nums">
                  {formatCash(customer.total)}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-ios-muted">
                개당 {formatCash(customer.unitPrice)}
              </p>

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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={SPRING_SNAPPY}
              className="px-4 py-3"
            >
              <button
                type="button"
                onClick={callCustomer}
                disabled={status !== 'playing'}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ios-accent text-[15px] font-semibold text-white active:opacity-80 disabled:bg-ios-separator/20 disabled:text-ios-muted"
              >
                <UserRound className="size-4" aria-hidden />
                손님 받기
              </button>
            </motion.div>
          )}
        </Group>

        <AnimatePresence>
          {feedback ? (
            <motion.p
              key={feedback.text}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={SPRING_SNAPPY}
              role="status"
              className={cn(
                'mx-4 mt-4 border-l-2 pl-3 py-1 text-[12px]',
                feedback.tone === 'ok' && 'border-ios-green text-ios-green',
                feedback.tone === 'warn' && 'border-ios-orange text-ios-orange',
                feedback.tone === 'error' && 'border-ios-red text-ios-red',
              )}
            >
              {feedback.text}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <Group
          label="약속"
          footer={
            booked.length > 0
              ? `잡힌 약속 ${appointmentStats.booked}건 · 완료 ${appointmentStats.done} · 놓침 ${appointmentStats.missed}`
              : `완료 ${appointmentStats.done} · 놓침 ${appointmentStats.missed}. 약속은 메신저 답장으로 생깁니다.`
          }
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
                  className="border-b border-ios-separator/10 px-4 py-3 last:border-b-0"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[15px] font-semibold">{npc?.name ?? '손님'}</span>
                    <span className="text-[15px] font-semibold tabular-nums">
                      {formatCash(dealTotal(deal))}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[12px] text-ios-muted">
                    <Pill tone={late ? 'red' : 'blue'}>{formatDealEta(deal, gameDateTime)}</Pill>
                    <span className="truncate">
                      {deal.productName} ×{deal.qty} · 보유 {stock}
                    </span>
                  </div>

                  {/* Where to meet: safety vs. a shorter walk. */}
                  {(() => {
                    const chosen = findMeeting(meetSpots, deal.placeId);
                    return (
                      <div className="mt-2 border-t border-ios-separator/10 pt-2">
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="text-ios-muted">
                            만남 {chosen ? chosen.name : '미정'}
                          </span>
                          {chosen ? (
                            <span className="text-ios-muted">
                              {patrolLabelOf(chosen.patrol)} · {chosen.tripMinutes}분
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
        </Group>

        <Group
          label="재고"
          trailing={
            <span className="text-[12px] font-medium tabular-nums text-ios-muted">
              {stockUnits}/{STORAGE_CAPACITY}
            </span>
          }
          footer={
            inventory.length
              ? `원가 ${formatCash(stockValue)}${
                  stockUnits > STORAGE_CAPACITY
                    ? ' · 초과분은 마감 때 heat와 압수 위험이 커집니다'
                    : ''
                }`
              : '브라우저에서 매입하면 배송을 거쳐 여기로 들어옵니다.'
          }
        >
          {inventory.length === 0 ? (
            <EmptyState
              icon={Package}
              title="재고가 없습니다"
              description="브라우저를 열고 암시장에서 첫 물량을 주문하세요."
            />
          ) : (
            inventory.map((item) => (
              <Row
                key={item.id}
                icon={<Package className="size-4 text-ios-muted" />}
                title={item.name}
                subtitle={`원가 ${formatCash(item.unitCost)}${
                  item.marketPrice ? ` · 시세 ${formatCash(item.marketPrice)}` : ''
                }`}
                value={`×${item.qty}`}
              />
            ))
          )}
        </Group>

        <Group label="하루 마감">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between text-[13px] tabular-nums">
              <span className="text-ios-muted">
                판매 <span className="font-semibold text-ios-text">{stats.sales}</span>
              </span>
              <span className="text-ios-muted">
                매출 <span className="font-semibold text-ios-text">{formatCash(stats.revenue)}</span>
              </span>
              <span className="text-ios-muted">
                잠복 <span className="font-semibold text-ios-text">{stats.stings}</span>
              </span>
            </div>
            <p className="mt-2 text-[11px] text-ios-muted">
              마감하면 하루 지출이 빠지고 heat가 식습니다. 현금 보관 위험 +{cashRisk}.
            </p>
            <button
              type="button"
              onClick={closeDay}
              disabled={status !== 'playing'}
              className="mt-3 flex h-11 w-full items-center justify-center rounded-xl border border-ios-separator/30 text-[15px] font-semibold text-ios-text active:bg-ios-separator/10 disabled:opacity-50"
            >
              하루 마감하고 다음 날로
            </button>
          </div>
        </Group>

        <p className="flex items-center justify-center gap-1.5 px-4 pb-8 pt-6 text-[11px] text-ios-muted">
          <Flame className="size-3" aria-hidden />
          전부 허구의 게임 시스템입니다.
        </p>
      </AppShell>

      <AnimatePresence>
        {reportOpen && lastReport ? (
          <DayReportSheet report={lastReport} onClose={() => setReportOpen(false)} />
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
            <p className="text-[12px] text-ios-muted">Day {report.day} 마감</p>
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

        <div className="border-t border-ios-separator/15">
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
          <div className="mt-4 border-l-2 border-ios-orange pl-3">
            <p className="text-[13px] font-semibold text-ios-orange">{report.event.title}</p>
            <p className="mt-1 text-[12px] text-ios-muted">{report.event.description}</p>
            <p className="mt-1 text-[11px] tabular-nums text-ios-muted">
              heat {report.event.heatDelta >= 0 ? '+' : ''}
              {report.event.heatDelta} · 현금 {report.event.cashDelta >= 0 ? '+' : ''}
              {formatCash(report.event.cashDelta)}
            </p>
          </div>
        ) : (
          <p className="mt-4 text-[13px] text-ios-muted">
            조용한 하루였다. 특별한 사건 없이 밤이 지나갔다.
          </p>
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
    <div className="flex items-baseline justify-between gap-3 border-b border-ios-separator/10 py-2.5 last:border-b-0">
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
