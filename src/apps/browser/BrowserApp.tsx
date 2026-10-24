import { useState } from 'react';
import { ArrowLeft, Globe, Lock, ShieldAlert } from 'lucide-react';
import { clues, markets } from '@/data';
import { describeStatus, suspicionScore } from '@/game';
import { AppShell } from '../AppShell';
import { Row, Section } from '../SectionList';
import { cn } from '@/utils/cn';

export function BrowserApp() {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = markets.find((m) => m.id === openId) ?? null;

  if (open) {
    const score = suspicionScore(open, clues);
    return (
      <AppShell
        title="브라우저"
        leading={
          <button
            type="button"
            aria-label="뒤로"
            className="-ml-1 flex size-11 items-center justify-center text-ios-accent"
            onClick={() => setOpenId(null)}
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
        }
      >
        <div className="p-4">
          <div className="glass sticky top-0 mb-4 flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-black/5">
            <Lock className="size-3.5 text-ios-green" aria-hidden />
            <span className="truncate text-[13px] text-ios-muted">
              hxxp://{open.name.toLowerCase()}.onion
            </span>
          </div>

          <h2 className="text-[22px] font-bold">{open.name}</h2>
          <p className="mt-1 text-[13px] text-ios-muted">{open.tagline}</p>

          <div className="mt-4 rounded-2xl bg-ios-surface p-4 ring-1 ring-black/5 dark:ring-white/5">
            <p className="text-[12px] font-medium text-ios-muted">단서 (일부는 노이즈입니다)</p>
            <ul className="mt-2 space-y-1.5">
              {open.traits.map((trait) => (
                <li key={trait} className="text-[14px]">
                  • {trait}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12px] text-ios-muted">
              참고 지표: 의심도 {score}/100 · {describeStatus(open.status)}
            </p>
          </div>

          <button
            type="button"
            disabled
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ios-separator/20 text-[16px] font-semibold text-ios-muted"
          >
            <ShieldAlert className="size-4" aria-hidden />
            거래 시스템은 아직 연결되지 않았습니다
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="브라우저" largeTitle>
      <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl bg-ios-surface px-3 py-2 ring-1 ring-black/5 dark:ring-white/5">
        <Globe className="size-4 text-ios-muted" aria-hidden />
        <span className="text-[14px] text-ios-muted">게임 속 가짜 검색 결과</span>
      </div>

      <Section header="암시장 목록" footer="사이트의 진위는 직접 판단해야 합니다.">
        {markets.map((market) => (
          <Row
            key={market.id}
            icon={<Globe className="size-4 text-ios-accent" aria-hidden />}
            title={market.name}
            subtitle={market.tagline}
            trailing={<span className="text-ios-separator" aria-hidden>›</span>}
            onClick={() => setOpenId(market.id)}
            className={cn('cursor-pointer')}
          />
        ))}
      </Section>
    </AppShell>
  );
}
