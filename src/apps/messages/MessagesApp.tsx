import { MessageCircle } from 'lucide-react';
import { npcs } from '@/data';
import { AppShell } from '../AppShell';
import { Row, Section } from '../SectionList';

const kindLabel: Record<string, string> = {
  regular: '단골',
  difficult: '진상',
  undercover: '수상함',
};

export function MessagesApp() {
  return (
    <AppShell title="메시지" largeTitle>
      <Section header="대화" footer="대화 내용은 다음 단계에서 연결됩니다.">
        {npcs.map((npc) => (
          <Row
            key={npc.id}
            icon={
              <span className="flex size-7 items-center justify-center rounded-full bg-ios-green/15">
                <MessageCircle className="size-4 text-ios-green" aria-hidden />
              </span>
            }
            title={npc.name}
            subtitle={npc.bio}
            value={kindLabel[npc.kind] ?? npc.kind}
          />
        ))}
      </Section>
    </AppShell>
  );
}
