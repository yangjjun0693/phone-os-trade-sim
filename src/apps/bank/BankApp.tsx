import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownToLine, ArrowUpFromLine, ShieldAlert } from 'lucide-react';
import { AnimatedNumber, Pill } from '@/components';
import { BANK_QUICK_AMOUNTS } from '@/content/economy';
import { useGameStore } from '@/store/gameStore';
import { useOSStore } from '@/store/osStore';
import type { BankTransaction } from '@/game/bank';
import { SPRING_SNAPPY, prefersReducedMotion } from '@/utils/motion';
import { formatCash } from '@/utils/format';
import { cn } from '@/utils/cn';
import { haptic } from '@/utils/haptics';
import { AppShell } from '../AppShell';
import { Section } from '../SectionList';

const QUICK_AMOUNTS = BANK_QUICK_AMOUNTS;

function formatTxDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/** 초콜렛뱅크 — real-name account. Cash in/out and a (fictional) monitoring system. */
export function BankApp() {
  const playerName = useGameStore((s) => s.playerName);
  const cash = useGameStore((s) => s.cash);
  const bank = useGameStore((s) => s.bank);
  const gameDateTime = useGameStore((s) => s.gameDateTime);
  const deposit = useGameStore((s) => s.bankDeposit);
  const withdraw = useGameStore((s) => s.bankWithdraw);
  const pushNotification = useOSStore((s) => s.pushNotification);

  const [amountText, setAmountText] = useState('');
  const [message, setMessage] = useState<{ tone: 'ok' | 'error' | 'alert'; text: string } | null>(null);
  const reduced = prefersReducedMotion();

  const amount = Number(amountText.replace(/[^0-9]/g, '')) || 0;

  const run = (kind: 'deposit' | 'withdraw') => {
    const result = kind === 'deposit' ? deposit(amount) : withdraw(amount);
    if (!result.ok) {
      haptic(12);
      setMessage({ tone: 'error', text: result.error ?? '처리하지 못했습니다.' });
      return;
    }
    haptic(8);
    setAmountText('');
    if (kind === 'deposit' && result.flagged) {
      setMessage({
        tone: 'alert',
        text: `이상거래 탐지 시스템이 이 입금을 확인 중입니다. (${result.reason})`,
      });
      pushNotification({
        id: `bank-${Date.now()}`,
        appId: 'bank',
        title: '초콜렛뱅크',
        body: '고객님 계좌의 최근 입금 내역에 대한 확인 안내가 도착했습니다.',
        date: gameDateTime,
      });
    } else {
      setMessage({ tone: 'ok', text: kind === 'deposit' ? '입금이 완료되었습니다.' : '출금이 완료되었습니다.' });
    }
  };

  return (
    <AppShell title="초콜렛뱅크" largeTitle>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_SNAPPY}
        className="relative mx-4 mb-4 overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 to-teal-800 p-5 text-white shadow-lg"
      >
        <div className="relative flex items-start justify-between gap-3 text-[12px] opacity-80">
          <div>
            <p>초콜렛 입출금통장</p>
            <p className="mt-0.5 text-[11px]">예금주 {playerName}</p>
          </div>
          <span className="shrink-0 tabular-nums">110-4821-7730</span>
        </div>
        <AnimatedNumber
          value={bank.balance}
          format={formatCash}
          className="relative mt-3 block text-[32px] font-bold"
        />
        <div className="relative mt-3 flex items-center justify-between rounded-2xl bg-black/20 px-3 py-2 text-[13px]">
          <span className="opacity-80">내 손의 현금</span>
          <AnimatedNumber value={cash} format={formatCash} className="font-semibold" />
        </div>
      </motion.div>

      <AnimatePresence initial={false}>
        {message ? (
          <motion.div
            key={message.text}
            initial={reduced ? false : { opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={SPRING_SNAPPY}
            role={message.tone === 'ok' ? 'status' : 'alert'}
            className={cn(
              'mx-4 mb-4 flex items-start gap-2 rounded-2xl px-3.5 py-3 text-[13px]',
              message.tone === 'ok' && 'bg-ios-green/15 text-ios-green',
              message.tone === 'error' && 'bg-ios-red/15 text-ios-red',
              message.tone === 'alert' && 'bg-ios-orange/15 text-ios-orange',
            )}
          >
            {message.tone === 'alert' ? <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> : null}
            <span>{message.text}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Section header="입출금" footer="큰 금액이나 짧은 기간의 반복 현금 입금은 확인 대상이 될 수 있습니다.">
        <div className="space-y-3 p-4">
          <label className="block">
            <span className="mb-1.5 block text-[12px] text-ios-muted">금액</span>
            <input
              inputMode="numeric"
              value={amount ? amount.toLocaleString('ko-KR') : ''}
              onChange={(event) => setAmountText(event.target.value)}
              placeholder="0"
              className="h-12 w-full rounded-xl bg-ios-bg px-3 text-[20px] font-semibold tabular-nums outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-ios-accent/40 dark:ring-white/10"
            />
          </label>
          <div className="flex gap-2">
            {QUICK_AMOUNTS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmountText(String(value))}
                className="h-9 flex-1 rounded-full bg-ios-bg text-[13px] font-medium active:scale-95"
              >
                {formatCash(value)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => run('deposit')}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-ios-accent text-[15px] font-semibold text-white active:scale-[0.97]"
            >
              <ArrowDownToLine className="size-4" aria-hidden /> 입금
            </button>
            <button
              type="button"
              onClick={() => run('withdraw')}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-ios-bg text-[15px] font-semibold active:scale-[0.97]"
            >
              <ArrowUpFromLine className="size-4" aria-hidden /> 출금
            </button>
          </div>
        </div>
      </Section>

      <Section header="거래 내역">
        <ul>
          <AnimatePresence initial={false}>
            {bank.transactions.map((tx: BankTransaction) => (
              <motion.li
                key={tx.id}
                layout={!reduced}
                initial={reduced ? false : { opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={SPRING_SNAPPY}
                className="flex items-center gap-3 border-b border-ios-separator/20 px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px]">{tx.memo}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ios-muted">
                    {formatTxDate(tx.at)}
                    {tx.flagged ? (
                      <Pill tone="orange" className="text-[10px]">
                        확인 중
                      </Pill>
                    ) : null}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 text-[15px] font-semibold tabular-nums',
                    tx.amount > 0 ? 'text-ios-blue' : 'text-ios-text',
                  )}
                >
                  {tx.amount > 0 ? '+' : '-'}
                  {formatCash(Math.abs(tx.amount))}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </Section>
    </AppShell>
  );
}
