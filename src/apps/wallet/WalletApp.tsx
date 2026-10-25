import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, CreditCard } from 'lucide-react';
import { AnimatedNumber, Pill } from '@/components';
import { useGameStore } from '@/store/gameStore';
import { formatCash } from '@/utils/format';
import { SPRING_SOFT } from '@/utils/motion';
import { AppShell } from '../AppShell';
import { EmptyState } from '../EmptyState';
import { Section } from '../SectionList';

export function WalletApp() {
  const playerName = useGameStore((s) => s.playerName);
  const cash = useGameStore((s) => s.cash);
  const day = useGameStore((s) => s.day);

  return (
    <AppShell title="지갑" largeTitle>
      <motion.div
        initial={{ opacity: 0, y: 16, rotateX: -8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={SPRING_SOFT}
        style={{ transformPerspective: 900 }}
        className="relative mx-4 mb-6 overflow-hidden rounded-3xl bg-[length:200%_200%] bg-gradient-to-br from-slate-600 via-slate-800 to-slate-950 p-5 text-white shadow-xl"
      >
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-[13px] font-semibold">{playerName}</p>
            <p className="mt-0.5 text-[12px] opacity-60">게임 내 잔액</p>
          </div>
          <CreditCard className="size-5 opacity-70" aria-hidden />
        </div>
        <AnimatedNumber
          value={cash}
          format={formatCash}
          className="relative mt-3 block text-[30px] font-bold"
        />
        <div className="relative mt-2 flex items-center gap-2">
          <Pill tone="neutral" className="bg-white/15 text-white/80">
            Day {day}
          </Pill>
          <span className="text-[12px] opacity-60">전부 허구의 화폐입니다</span>
        </div>
      </motion.div>

      <Section header="거래 내역" footer="송금·입금 기능은 다음 단계에서 연결됩니다." delay={0.05}>
        <EmptyState
          icon={ArrowUpRight}
          title="내역이 없습니다"
          description="아직 이 지갑에 기록된 거래가 없습니다."
        />
      </Section>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_SOFT, delay: 0.12 }}
        className="mx-4 mb-8 grid grid-cols-2 gap-3"
      >
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
      </motion.div>
    </AppShell>
  );
}
