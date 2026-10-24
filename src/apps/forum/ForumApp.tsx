import { MessagesSquare } from 'lucide-react';
import { AppShell } from '../AppShell';
import { EmptyState } from '../EmptyState';
import { Section } from '../SectionList';

export function ForumApp() {
  return (
    <AppShell title="포럼" largeTitle>
      <Section header="최근 글">
        <EmptyState
          icon={MessagesSquare}
          title="게시글이 없습니다"
          description="게임 속 가짜 포럼입니다. 실제 서비스나 실제 방법을 다루지 않습니다."
        />
      </Section>
    </AppShell>
  );
}
