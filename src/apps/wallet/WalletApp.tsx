import { ArrowDownLeft, ArrowUpRight, CreditCard } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { formatCash } from '@/utils/format';
import { AppShell } from '../AppShell';
import { EmptyState } from '../EmptyState';
import { Section } from '../SectionList';

export function WalletApp() {
  const cash = useGameStore((s) => s.cash);
  const day = useGameStore((s) => s.day);

  return (
    <AppShell title="지갑" largeTitle>
      <div className="mx-4 mb-6 rounded-3xl bg-gradient-to-br from-slate-700 to-slate-900 p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-[13px] opacity-70">게임 내 잔액</span>
          <CreditCard className="size-5 opacity-70" aria-hidden />
        </div>
        <p className="mt-3 text-[30px] font-bold tabular-nums">{formatCash(cash)}</p>
        <p className="mt-1 text-[12px] opacity-60">Day {day} · 전부 허구의 화폐입니다</p>
      </div>

      <Section header="거래 내역" footer="송금·입금 기능은 다음 단계에서 연결됩니다.">
        <EmptyState icon={ArrowUpRight} title="내역이 없습니다" description="아직 이 지갑에 기록된 거래가 없습니다." />
      </Section>

      <div className="mx-4 mb-8 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-ios-surface text-[15px] font-semibold text-ios-muted ring-1 ring-black/5 dark:ring-white/5"
        >
          <ArrowUpRight className="size-4" aria-hidden /> 보내기
        </button>
        <button
          type="button"
          disabled
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-ios-surface text-[15px] font-semibold text-ios-muted ring-1 ring-black/5 dark:ring-white/5"
        >
          <ArrowDownLeft className="size-4" aria-hidden /> 받기
        </button>
      </div>
    </AppShell>
  );
}
