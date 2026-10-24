import { Mail } from 'lucide-react';
import { AppShell } from '../AppShell';
import { EmptyState } from '../EmptyState';
import { Section } from '../SectionList';

export function MailApp() {
  return (
    <AppShell title="메일" largeTitle>
      <Section header="받은 편지함">
        <EmptyState
          icon={Mail}
          title="받은 메일이 없습니다"
          description="스토리는 메일·메신저·포럼 글로만 전달됩니다. 컷신은 없습니다."
        />
      </Section>
    </AppShell>
  );
}
