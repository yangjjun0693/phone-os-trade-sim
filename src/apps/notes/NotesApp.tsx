import { StickyNote } from 'lucide-react';
import { AppShell } from '../AppShell';
import { Row, Section } from '../SectionList';

const SAMPLE_NOTES = [
  { id: 'n1', title: '단골 시간표', body: '금요일 밤. 달이. 현금만.' },
  { id: 'n2', title: '의심되는 사이트', body: '가격이 너무 낮으면 일단 의심.' },
];

export function NotesApp() {
  return (
    <AppShell title="메모" largeTitle>
      <Section header="메모" footer="메모 작성/저장은 다음 단계에서 연결됩니다.">
        {SAMPLE_NOTES.map((note) => (
          <Row
            key={note.id}
            icon={<StickyNote className="size-4 text-ios-orange" aria-hidden />}
            title={note.title}
            subtitle={note.body}
          />
        ))}
      </Section>
    </AppShell>
  );
}
