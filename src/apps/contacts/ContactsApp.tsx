import { Users } from 'lucide-react';
import { npcs } from '@/data';
import { AppShell } from '../AppShell';
import { Row, Section } from '../SectionList';

export function ContactsApp() {
  return (
    <AppShell title="연락처" largeTitle>
      <Section header="연락처" footer="딜러 고용·관리 기능은 후반 확장에서 붙습니다.">
        {npcs.map((npc) => (
          <Row key={npc.id} icon={<Users className="size-4 text-ios-muted" aria-hidden />} title={npc.name} />
        ))}
      </Section>
    </AppShell>
  );
}
