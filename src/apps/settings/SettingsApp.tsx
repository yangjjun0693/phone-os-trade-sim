import { useRef, useState } from 'react';
import { Cloud, Download, Info, Moon, RotateCcw, Sun, Upload } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { SAVE_VERSION, SaveDataSchema, localSaveService, type SaveData } from '@/lib/saveService';
import { useGameStore } from '@/store/gameStore';
import { useOSStore } from '@/store/osStore';
import type { InventoryItem, ThemeMode } from '@/types';
import { cn } from '@/utils/cn';
import { AppShell } from '../AppShell';
import { Row, Section } from '../SectionList';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
  { value: 'system', label: '시스템' },
];

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-8 w-[52px] shrink-0 rounded-full transition-colors',
        checked ? 'bg-ios-green' : 'bg-ios-separator/30',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 size-7 rounded-full bg-white shadow transition-all',
          checked ? 'left-[22px]' : 'left-0.5',
        )}
      />
    </button>
  );
}

function snapshot(): SaveData {
  const game = useGameStore.getState();
  const os = useOSStore.getState();
  return {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    game: {
      cash: game.cash,
      heat: game.heat,
      day: game.day,
      gameDateTime: game.gameDateTime,
      inventory: game.inventory,
    },
    os: {
      theme: os.theme,
      status: os.status,
      controls: os.controls,
      layout: os.layout,
    },
  };
}

export function SettingsApp() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const theme = useOSStore((s) => s.theme);
  const setTheme = useOSStore((s) => s.setTheme);
  const resetLayout = useOSStore((s) => s.resetLayout);

  const handleExport = async () => {
    const data = snapshot();
    await localSaveService.save(data);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `phone-os-save-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage('세이브를 내보냈습니다.');
  };

  const handleImportFile = async (file: File) => {
    try {
      const parsed = SaveDataSchema.safeParse(JSON.parse(await file.text()));
      if (!parsed.success) {
        setMessage('세이브 파일 형식이 올바르지 않습니다.');
        return;
      }
      const { game, os } = parsed.data as {
        game?: {
          cash?: number;
          heat?: number;
          day?: number;
          gameDateTime?: string;
          inventory?: InventoryItem[];
        };
        os?: { theme?: ThemeMode; layout?: ReturnType<typeof useOSStore.getState>['layout'] };
      };

      const gameStore = useGameStore.getState();
      if (typeof game?.cash === 'number') gameStore.setCash(game.cash);
      if (typeof game?.heat === 'number') gameStore.setHeat(game.heat);
      if (Array.isArray(game?.inventory)) gameStore.setInventory(game.inventory);

      if (os?.theme) setTheme(os.theme);
      if (os?.layout) useOSStore.getState().setLayout(os.layout);

      setMessage('세이브를 불러왔습니다.');
    } catch {
      setMessage('세이브를 읽지 못했습니다.');
    }
  };

  return (
    <AppShell title="설정" largeTitle>
      <Section header="화면">
        <div className="px-4 py-3">
          <p className="mb-2 text-[13px] text-ios-muted">테마</p>
          <div className="flex rounded-xl bg-ios-separator/15 p-0.5">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={theme === option.value}
                onClick={() => setTheme(option.value)}
                className={cn(
                  'flex-1 rounded-[10px] py-1.5 text-[14px] font-medium transition-colors',
                  theme === option.value ? 'bg-ios-surface shadow-sm' : 'text-ios-muted',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <Row
          icon={
            theme === 'dark' ? (
              <Moon className="size-4 text-ios-accent" aria-hidden />
            ) : (
              <Sun className="size-4 text-ios-orange" aria-hidden />
            )
          }
          title="다크 모드"
          subtitle="시스템 설정을 따르거나 직접 고정합니다."
          trailing={
            <Toggle
              label="다크 모드"
              checked={theme === 'dark'}
              onChange={(next) => setTheme(next ? 'dark' : 'light')}
            />
          }
        />
      </Section>

      <Section header="저장" footer="실제 키는 커밋되지 않습니다. .env.example를 참고하세요.">
        <Row
          icon={<Cloud className="size-4 text-ios-muted" aria-hidden />}
          title="클라우드 저장"
          subtitle={isSupabaseConfigured ? 'Supabase가 구성되었습니다.' : '오프라인 모드 (Supabase 미구성)'}
          value={isSupabaseConfigured ? '연결 대기' : '비활성'}
        />
        <Row
          icon={<Download className="size-4 text-ios-muted" aria-hidden />}
          title="세이브 내보내기"
          onClick={handleExport}
          trailing={<span className="text-ios-separator" aria-hidden>›</span>}
        />
        <Row
          icon={<Upload className="size-4 text-ios-muted" aria-hidden />}
          title="세이브 불러오기"
          onClick={() => fileRef.current?.click()}
          trailing={<span className="text-ios-separator" aria-hidden>›</span>}
        />
        <Row
          icon={<RotateCcw className="size-4 text-ios-red" aria-hidden />}
          title="홈 화면 배치 초기화"
          onClick={resetLayout}
        />
      </Section>

      <Section header="정보">
        <Row icon={<Info className="size-4 text-ios-muted" aria-hidden />} title="버전" value="0.1.0" />
        <Row
          icon={<Info className="size-4 text-ios-muted" aria-hidden />}
          title="사운드"
          subtitle="API 준비됨 · 오디오 에셋은 아직 미포함"
        />
      </Section>

      <div className="px-4 pb-10">
        <p className="rounded-xl bg-ios-surface p-3 text-[12px] text-ios-muted ring-1 ring-black/5 dark:ring-white/5">
          이 게임은 전부 허구이며 게임 내 가짜 시스템만 다룹니다.
        </p>
        {message ? <p className="mt-2 text-center text-[12px] text-ios-accent">{message}</p> : null}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleImportFile(file);
          event.target.value = '';
        }}
      />
    </AppShell>
  );
}
