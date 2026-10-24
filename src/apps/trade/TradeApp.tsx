import { Flame, Package, ReceiptText, TrendingUp } from 'lucide-react';
import { heatFromCash, heatLabel, heatTier } from '@/game';
import { useGameStore } from '@/store/gameStore';
import { formatCash } from '@/utils/format';
import { AppShell } from '../AppShell';
import { EmptyState } from '../EmptyState';
import { Row, Section } from '../SectionList';

const tierColor: Record<ReturnType<typeof heatTier>, string> = {
  calm: 'text-ios-green',
  watched: 'text-ios-orange',
  hot: 'text-ios-red',
  burned: 'text-ios-red',
};

export function TradeApp() {
  const cash = useGameStore((s) => s.cash);
  const heat = useGameStore((s) => s.heat);
  const inventory = useGameStore((s) => s.inventory);

  const tier = heatTier(heat);
  const cashRisk = heatFromCash(cash);

  return (
    <AppShell title="거래" largeTitle>
      <div className="mx-4 mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-ios-surface p-3.5 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
          <p className="text-[12px] font-medium text-ios-muted">현금</p>
          <p className="mt-1 text-[22px] font-bold tabular-nums">{formatCash(cash)}</p>
        </div>
        <div className="rounded-2xl bg-ios-surface p-3.5 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
          <p className="text-[12px] font-medium text-ios-muted">Heat</p>
          <p className={`mt-1 text-[22px] font-bold tabular-nums ${tierColor[tier]}`}>{heat}</p>
          <p className="text-[11px] text-ios-muted">{heatLabel(tier)}</p>
        </div>
        <div className="col-span-2 rounded-2xl bg-ios-surface p-3.5 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
          <p className="text-[12px] font-medium text-ios-muted">현금 보관 위험</p>
          <p className="mt-1 text-[13px] text-ios-muted">
            현재 지갑 때문에 추가로 쌓이는 heat: <span className="font-semibold">+{cashRisk}</span>
          </p>
          <p className="mt-1 text-[11px] text-ios-muted">
            현금이 많을수록 보관·도난·수색 위험이 올라갑니다.
          </p>
        </div>
      </div>

      <Section header="재고">
        {inventory.length === 0 ? (
          <Row icon={<Package className="size-4 text-ios-muted" />} title="재고가 없습니다" />
        ) : (
          inventory.map((item) => (
            <Row
              key={item.id}
              icon={<Package className="size-4 text-ios-muted" />}
              title={item.name}
              subtitle={`단가 ${formatCash(item.unitCost)}`}
              value={`×${item.qty}`}
            />
          ))
        )}
      </Section>

      <Section header="진행 중인 주문">
        <EmptyState
          icon={ReceiptText}
          title="아직 주문이 없습니다"
          description="거래 루프(가격 협상, 재고, 고객 NPC)는 다음 단계에서 붙습니다."
        />
      </Section>

      <p className="px-4 pb-8 text-center text-[11px] text-ios-muted">
        <TrendingUp className="mr-1 inline size-3 align-[-2px]" aria-hidden />
        전부 허구의 게임 시스템입니다.
        <Flame className="ml-1 inline size-3 align-[-2px]" aria-hidden />
      </p>
    </AppShell>
  );
}
