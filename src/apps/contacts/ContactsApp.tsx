import { motion } from 'framer-motion';
import { Search, UserRoundCheck, Users } from 'lucide-react';
import { npcs } from '@/data';
import { Pill, type PillTone } from '@/components';
import { RUNNERS } from '@/content/runners';
import { channelLabel } from '@/game';
import { useGameStore } from '@/store/gameStore';
import { formatCash } from '@/utils/format';
import { SPRING_SOFT } from '@/utils/motion';
import { AppShell } from '../AppShell';
import { Row, Section } from '../SectionList';
import type { CustomerKind } from '@/types';

const KIND_PILL: Record<CustomerKind, { tone: PillTone; label: string }> = {
  regular: { tone: 'green', label: '단골' },
  difficult: { tone: 'orange', label: '진상' },
  undercover: { tone: 'red', label: '수상함' },
};

/** 연락처 — the player's network: faces, channels and hired runners. */
export function ContactsApp() {
  const trust = useGameStore((s) => s.trust);
  const runners = useGameStore((s) => s.runners);
  const hireRunner = useGameStore((s) => s.hireRunner);
  const fireRunner = useGameStore((s) => s.fireRunner);

  return (
    <AppShell title="연락처" largeTitle>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_SOFT}
        className="mx-4 mb-4 flex items-center gap-2 rounded-full bg-ios-surface px-4 py-2.5 ring-1 ring-black/5 dark:ring-white/5"
      >
        <Search className="size-4 text-ios-muted" aria-hidden />
        <span className="text-[14px] text-ios-muted">
          아는 사람 {npcs.length}명 · 신뢰 {trust}
        </span>
      </motion.div>

      <Section
        header="러너"
        footer={
          runners.length > 0
            ? `일하는 러너 ${runners.length}명 · 하루 마감 때 수익이 들어옵니다. (잡히면 heat·신뢰 손실)`
            : '고용하면 하루 마감 때 자동으로 수익이 들어옵니다.'
        }
        delay={0.05}
      >
        {RUNNERS.map((template, index) => {
          const npc = npcs.find((entry) => entry.id === template.npcId);
          const hired = runners.find((runner) => runner.npcId === template.npcId);
          return (
            <Row
              key={template.npcId}
              animateIn={index}
              icon={<UserRoundCheck className="size-4 text-ios-green" aria-hidden />}
              title={npc?.name ?? template.npcId}
              subtitle={`${template.note} · 고용비 ${formatCash(template.hireCost)}`}
              value={
                hired ? (
                  <button
                    type="button"
                    onClick={() => fireRunner(hired.id)}
                    className="rounded-full bg-ios-separator/20 px-3 py-1 text-[12px] font-semibold text-ios-muted"
                  >
                    해고
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => hireRunner(template.npcId)}
                    className="rounded-full bg-ios-green px-3 py-1 text-[12px] font-semibold text-white"
                  >
                    고용
                  </button>
                )
              }
            />
          );
        })}
      </Section>

      <Section header="아는 사람" footer="각자 쓰는 메신저가 다릅니다." delay={0.12}>
        {npcs.map((npc, index) => {
          const pill = KIND_PILL[npc.kind] ?? KIND_PILL.regular;
          return (
            <Row
              key={npc.id}
              animateIn={index}
              icon={<Users className="size-4 text-ios-muted" aria-hidden />}
              title={npc.name}
              subtitle={npc.bio}
              value={
                <span className="flex shrink-0 items-center gap-1.5">
                  {npc.vendor ? <Pill tone="yellow">공급</Pill> : null}
                  <Pill tone={pill.tone}>{pill.label}</Pill>
                  <Pill tone="neutral">{channelLabel(npc.channel)}</Pill>
                </span>
              }
            />
          );
        })}
      </Section>
    </AppShell>
  );
}
