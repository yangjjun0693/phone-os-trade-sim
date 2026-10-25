import { MessageCircle } from 'lucide-react';
import { npcs } from '@/data';
import { Pill, type PillTone } from '@/components';
import type { CustomerKind } from '@/types';
import { AppShell } from '../AppShell';
import { Row, Section } from '../SectionList';

const KIND_PILL: Record<CustomerKind, { tone: PillTone; label: string }> = {
  regular: { tone: 'green', label: '단골' },
  difficult: { tone: 'orange', label: '진상' },
  undercover: { tone: 'red', label: '수상함' },
};

export function MessagesApp() {
  return (
    <AppShell title="메시지" largeTitle>
      <Section header="대화" footer="대화 내용은 다음 단계에서 연결됩니다." delay={0.05}>
        {npcs.map((npc, index) => {
          const pill = KIND_PILL[npc.kind] ?? KIND_PILL.regular;
          return (
            <Row
              key={npc.id}
              animateIn={index}
              icon={
                <span className="flex size-7 items-center justify-center rounded-full bg-ios-green/15">
                  <MessageCircle className="size-4 text-ios-green" aria-hidden />
                </span>
              }
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
