import { motion } from 'framer-motion';
import { Search, Users } from 'lucide-react';
import { npcs } from '@/data';
import { Pill, type PillTone } from '@/components';
import type { CustomerKind } from '@/types';
import { SPRING_SOFT } from '@/utils/motion';
import { AppShell } from '../AppShell';
import { Row, Section } from '../SectionList';

const KIND_PILL: Record<CustomerKind, { tone: PillTone; label: string }> = {
  regular: { tone: 'green', label: '단골' },
  difficult: { tone: 'orange', label: '진상' },
  undercover: { tone: 'red', label: '수상함' },
};

export function ContactsApp() {
  return (
    <AppShell title="연락처" largeTitle>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_SOFT}
        className="mx-4 mb-4 flex items-center gap-2 rounded-full bg-ios-surface px-4 py-2.5 ring-1 ring-black/5 dark:ring-white/5"
      >
        <Search className="size-4 text-ios-muted" aria-hidden />
        <span className="text-[14px] text-ios-muted">이름 또는 별명 검색</span>
      </motion.div>

      <Section
        header="연락처"
        footer="딜러 고용·관리 기능은 후반 확장에서 붙습니다."
        delay={0.05}
      >
        {npcs.map((npc, index) => {
          const pill = KIND_PILL[npc.kind] ?? KIND_PILL.regular;
          return (
            <Row
              key={npc.id}
              animateIn={index}
              icon={<Users className="size-4 text-ios-muted" aria-hidden />}
              title={npc.name}
              subtitle={npc.bio}
              value={<Pill tone={pill.tone}>{pill.label}</Pill>}
            />
          );
        })}
      </Section>
    </AppShell>
  );
}
