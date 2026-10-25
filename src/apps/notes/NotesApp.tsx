import { StickyNote } from 'lucide-react';
import { Pill } from '@/components';
import { AppShell } from '../AppShell';
import { Row, Section } from '../SectionList';

const SAMPLE_NOTES = [
  { id: 'n1', title: '단골 시간표', body: '금요일 밤. 달이. 현금만.' },
  { id: 'n2', title: '의심되는 사이트', body: '가격이 너무 낮으면 일단 의심.' },
];

export function NotesApp() {
  return (
    <AppShell title="메모" largeTitle>
      <Section
        header="메모"
        footer="메모 작성/저장은 다음 단계에서 연결됩니다."
        delay={0.05}
      >
        {SAMPLE_NOTES.map((note, index) => (
          <Row
            key={note.id}
            animateIn={index}
            icon={<StickyNote className="size-4 text-ios-orange" aria-hidden />}
            title={note.title}
            subtitle={note.body}
            value={index === 0 ? <Pill tone="orange">중요</Pill> : undefined}
          />
        ))}
      </Section>

      <Section header="동기화" footer="메모는 이 기기 안에만 저장됩니다." delay={0.12}>
        <Row
          animateIn={0}
          icon={<StickyNote className="size-4 text-ios-muted" aria-hidden />}
          title="iCloud 메모"
          subtitle="게임 속 가짜 동기화입니다."
          value={<Pill tone="neutral">꺼짐</Pill>}
        />
      </Section>
    </AppShell>
  );
}
