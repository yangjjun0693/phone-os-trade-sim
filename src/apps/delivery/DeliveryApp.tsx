import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, PackageSearch } from 'lucide-react';
import { Pill } from '@/components';
import { findAddress } from '@/content/logistics';
import { SHIPMENT_LABEL, formatShipmentEta, shipmentTotals } from '@/game';
import { useGameStore } from '@/store/gameStore';
import { formatCash } from '@/utils/format';
import { SPRING_SNAPPY, fadeUp, staggerContainer } from '@/utils/motion';
import { AppShell } from '../AppShell';
import { EmptyState } from '../EmptyState';
import { Section } from '../SectionList';

const TONE = {
  in_transit: 'blue',
  arrived: 'green',
  collected: 'neutral',
  seized: 'red',
  lost: 'red',
} as const;

/** 구팡 — only real parcels: everything the player has ordered and must collect. */
export function DeliveryApp() {
  const shipments = useGameStore((s) => s.shipments);
  const collectShipment = useGameStore((s) => s.collectShipment);
  const gameDateTime = useGameStore((s) => s.gameDateTime);

  const totals = useMemo(() => shipmentTotals(shipments), [shipments]);
  const arrived = shipments.filter((shipment) => shipment.status === 'arrived');
  const moving = shipments.filter((shipment) => shipment.status === 'in_transit');
  const finished = shipments.filter(
    (shipment) =>
      shipment.status === 'collected' || shipment.status === 'seized' || shipment.status === 'lost',
  );

  return (
    <AppShell title="구팡" largeTitle>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_SNAPPY}
        className="mx-4 mb-4 grid grid-cols-3 gap-2 text-center"
      >
        {[
          { label: '배송 중', value: totals.in_transit },
          { label: '수령 대기', value: totals.arrived },
          { label: '완료', value: totals.collected },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-ios-surface py-2.5 ring-1 ring-black/5 dark:ring-white/5"
          >
            <p className="text-[11px] text-ios-muted">{stat.label}</p>
            <p className="text-[18px] font-bold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {arrived.length > 0 ? (
        <Section
          header="수령 대기"
          footer="수령해야 재고가 됩니다. 오래 두면 좋을 일이 없습니다."
          delay={0.04}
        >
          <motion.ul
            variants={staggerContainer(0.05)}
            initial="hidden"
            animate="show"
            className="divide-y divide-ios-separator/15"
          >
            {arrived.map((shipment) => (
              <motion.li key={shipment.id} variants={fadeUp} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Pill tone={TONE[shipment.status]}>{SHIPMENT_LABEL[shipment.status]}</Pill>
                  <span className="text-[11px] text-ios-muted">
                    {findAddress(shipment.address).label}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-[16px] font-semibold">
                  {shipment.productName} ×{shipment.qty}
                </p>
                <button
                  type="button"
                  onClick={() => collectShipment(shipment.id)}
                  className="mt-2 h-9 w-full rounded-xl bg-ios-green text-[13px] font-semibold text-white"
                >
                  수령하기
                </button>
              </motion.li>
            ))}
          </motion.ul>
        </Section>
      ) : null}

      <Section
        header="배송 중"
        footer="주소에 따라 도착 heat와 압수·분실 위험이 달라집니다."
        delay={0.08}
      >
        {moving.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="오고 있는 물량이 없습니다"
            description="브라우저의 마켓에서 주문하면 여기로 배송됩니다."
          />
        ) : (
          <>
            <motion.ul
              variants={staggerContainer(0.05)}
              initial="hidden"
              animate="show"
              className="divide-y divide-ios-separator/15"
            >
              {moving.map((shipment) => (
                <motion.li key={shipment.id} variants={fadeUp} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Pill tone={TONE[shipment.status]}>{SHIPMENT_LABEL[shipment.status]}</Pill>
                    <span className="flex items-center gap-1 text-[11px] text-ios-muted">
                      <MapPin className="size-3" aria-hidden />
                      {findAddress(shipment.address).label}
                    </span>
                    <span className="ml-auto text-[11px] text-ios-muted">
                      {formatShipmentEta(shipment, gameDateTime)}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-[16px] font-semibold">
                    {shipment.productName} ×{shipment.qty}
                  </p>
                  <p className="mt-0.5 text-[12px] text-ios-muted">
                    {shipment.marketId.replace(/^market-/, '')} · 개당{' '}
                    {formatCash(shipment.unitCost)}
                    {shipment.fee > 0 ? ` · 배송료 ${formatCash(shipment.fee)}` : ''}
                  </p>
                </motion.li>
              ))}
            </motion.ul>
            <p className="px-4 pt-3 text-[11px] text-ios-muted">
              도착 heat: {moving.map((shipment) => findAddress(shipment.address).heat).join(' / ')}
            </p>
          </>
        )}
      </Section>

      {finished.length > 0 ? (
        <Section header="지난 배송" delay={0.12}>
          <motion.ul
            variants={staggerContainer(0.04)}
            initial="hidden"
            animate="show"
            className="divide-y divide-ios-separator/15"
          >
            {finished.slice(0, 8).map((shipment) => (
              <motion.li key={shipment.id} variants={fadeUp} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Pill tone={TONE[shipment.status]}>{SHIPMENT_LABEL[shipment.status]}</Pill>
                  <span className="ml-auto text-[11px] text-ios-muted">
                    {shipment.note ?? findAddress(shipment.address).label}
                  </span>
                </div>
                <p className="mt-1 truncate text-[15px]">
                  {shipment.productName} ×{shipment.qty}
                </p>
              </motion.li>
            ))}
          </motion.ul>
        </Section>
      ) : null}

      <p className="flex items-center justify-center gap-1.5 px-4 pb-8 pt-2 text-[12px] text-ios-muted">
        <PackageSearch className="size-4" aria-hidden /> 모든 물량은 게임 속 가짜 상품입니다.
      </p>
    </AppShell>
  );
}
