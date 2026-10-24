import { useRef, useState, useMemo } from 'react';
import { Cloud, Download, Info, Moon, RotateCcw, Sun, Upload, User, UserCheck, Shield, AlertTriangle, LogOut, Key, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { SAVE_VERSION, SaveDataSchema, localSaveService, type SaveData } from '@/lib/saveService';
import { useGameStore } from '@/store/gameStore';
import { useOSStore } from '@/store/osStore';
import { computeTotalExposure, getExposureTier, getExposureTierColor, getIdentityLabel, getIdentityDescription, getSupportedIdentities, switchIdentity, logoutIdentity, getAppIdentity, type IdentityKind } from '@/game';
import type { InventoryItem, ThemeMode, IdentityState, AppIdentityMap } from '@/types';
import { cn } from '@/utils/cn';
import { AppShell } from '../AppShell';
import { Row, Section } from '../SectionList';
import { getApp } from '../registry';
import { SPRING_SNAPPY, prefersReducedMotion } from '@/utils/motion';
import { motion, AnimatePresence } from 'framer-motion';

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

interface IdentityRowProps {
  appId: string;
  appName: string;
  icon: React.ReactNode;
  gradient: [string, string];
  identity: IdentityState;
  onSwitch: (kind: IdentityKind) => void;
  onLogout: () => void;
}

function IdentityRow({ appId, appName, Icon, gradient, identity, onSwitch, onLogout }: Omit<IdentityRowProps, 'icon'> & { Icon: React.ComponentType<{ size?: number; className?: string }> }) {
  const supported = getSupportedIdentities(appId);
  const canSwitch = supported.length > 1;
  const reduced = prefersReducedMotion();

  return (
    <motion.div
      layout
      initial={reduced ? undefined : { opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative"
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-ios-surface ring-1 ring-black/5 dark:ring-white/5">
        <div className="relative size-10 shrink-0 overflow-hidden rounded-xl flex items-center justify-center">
          <Icon size={40} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{appName}</p>
          <p className="text-[12px] text-ios-muted">
            현재: <span className="font-medium capitalize">{getIdentityLabel(identity.active)}</span>
            {identity.loggedIn && identity.lastSwitchedAt && (
              <span className="ml-2">· 전환: {new Date(identity.lastSwitchedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canSwitch && (
            <>
              <button
                onClick={() => onSwitch('realname')}
                disabled={identity.active === 'realname' || !identity.loggedIn}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-[12px] font-medium transition-colors',
                  identity.active === 'realname'
                    ? 'bg-ios-blue text-white'
                    : 'bg-ios-separator/20 text-ios-muted hover:bg-ios-separator/30'
                )}
              >
                실명
              </button>
              <button
                onClick={() => onSwitch('alias')}
                disabled={identity.active === 'alias' || !identity.loggedIn}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-[12px] font-medium transition-colors',
                  identity.active === 'alias'
                    ? 'bg-ios-purple text-white'
                    : 'bg-ios-separator/20 text-ios-muted hover:bg-ios-separator/30'
                )}
              >
                별명
              </button>
            </>
          )}
          {identity.loggedIn && (
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-ios-muted hover:text-ios-red hover:bg-ios-red/10"
              aria-label="로그아웃"
            >
              <LogOut className="size-4" />
            </button>
          )}
        </div>
      </div>
      {!canSwitch && identity.loggedIn && (
        <p className="ml-14 mt-1 text-[11px] text-ios-muted">
          이 앱은 {getIdentityLabel(supported[0])} 신원만 지원합니다.
        </p>
      )}
    </motion.div>
  );
}

export function SettingsApp() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showIdentities, setShowIdentities] = useState(false);

  const theme = useOSStore((s) => s.theme);
  const setTheme = useOSStore((s) => s.setTheme);
  const resetLayout = useOSStore((s) => s.resetLayout);

  const identities = useGameStore(s => s.identities);
  const gameDateTime = useGameStore(s => s.gameDateTime);
  const switchIdentityStore = useGameStore(s => s.switchIdentity);
  const logoutIdentityStore = useGameStore(s => s.logoutIdentity);

  const totalExposure = computeTotalExposure(identities);
  const exposureTier = getExposureTier(totalExposure);
  const exposureColor = getExposureTierColor(exposureTier);

  // Map text color classes to background color classes
  const exposureBgColor = exposureColor
    .replace('text-ios-green', 'bg-ios-green')
    .replace('text-ios-yellow', 'bg-ios-yellow')
    .replace('text-ios-orange', 'bg-ios-orange')
    .replace('text-ios-red', 'bg-ios-red');
  const exposureTextColor = exposureColor.replace('text-ios-', '');

  // Get all registered apps that support identity
  const identityApps = useMemo(() => {
    const apps = [
      'chroma', 'sailor', 'shade',
      'gmall', 'protean',
      'telegraph', 'ex', 'messagesCall',
      'trade', 'wallet', 'notes',
      'forum', 'contacts',
    ];
    return apps.map(appId => {
      const app = getApp(appId);
      const identity = getAppIdentity(identities, appId);
      return { appId, app, identity };
    }).filter(item => item.app);
  }, [identities]);

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
      <Section header="신원 관리" footer="각 앱별로 사용할 신원(실명/별명)을 선택하세요. 노출도는 게임 내 가상 수치입니다.">
        {/* Exposure Summary */}
        <motion.div
          initial={prefersReducedMotion() ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING_SNAPPY}
          className="mx-4 mb-4 p-4 rounded-2xl ring-1 ring-black/5 dark:ring-white/5"
          style={{ background: `linear-gradient(135deg, ${exposureBgColor}/20, ${exposureBgColor}/5)` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-ios-muted">총 노출도</p>
              <p className="mt-1 text-[28px] font-bold tabular-nums" style={{ color: `var(--ios-${exposureTextColor})` }}>
                {totalExposure}
              </p>
              <p className="mt-1 text-[12px] font-medium" style={{ color: `var(--ios-${exposureTextColor})` }}>
                {exposureTier === 'low' ? '낮음' : exposureTier === 'medium' ? '보통' : exposureTier === 'high' ? '높음' : '위험'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[12px] text-ios-muted">로그인된 앱</p>
              <p className="text-[22px] font-bold tabular-nums text-ios-text">
                {Object.keys(identities).filter(k => identities[k].loggedIn).length}
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-ios-separator/20 rounded-full overflow-hidden">
            <motion.div
              initial={prefersReducedMotion() ? false : { width: 0 }}
              animate={{ width: `${Math.min(100, totalExposure)}%` }}
              transition={SPRING_SNAPPY}
              className="h-full rounded-full"
              style={{ background: `var(--ios-${exposureTextColor})` }}
            />
          </div>
        </motion.div>

        <button
          onClick={() => setShowIdentities(!showIdentities)}
          className="mx-4 mb-4 flex items-center justify-between px-4 py-3 rounded-xl bg-ios-surface ring-1 ring-black/5 dark:ring-white/5"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-ios-purple/20 flex items-center justify-center">
              <Shield className="size-5 text-ios-purple" />
            </div>
            <div>
              <p className="font-medium">앱별 신원 설정</p>
              <p className="text-[12px] text-ios-muted">{identityApps.filter(i => i.identity.loggedIn).length}개 앱 로그인됨</p>
            </div>
          </div>
          <motion.span
            animate={{ rotate: showIdentities ? 180 : 0 }}
            transition={SPRING_SNAPPY}
            className="text-ios-muted"
          >
            <ChevronRight className="size-5" />
          </motion.span>
        </button>

        <AnimatePresence>
          {showIdentities && (
            <motion.div
              initial={prefersReducedMotion() ? undefined : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={prefersReducedMotion() ? undefined : { opacity: 0, height: 0 }}
              className="mx-4 mb-4 space-y-3"
            >
              {identityApps.map(({ appId, app, identity }) => (
                <IdentityRow
                  key={appId}
                  appId={appId}
                  appName={app!.name}
                  Icon={app!.icon}
                  gradient={app!.gradient}
                  identity={identity}
                  onSwitch={(kind) => switchIdentityStore(appId, kind)}
                  onLogout={() => logoutIdentityStore(appId)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

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
        <Row
          icon={<RotateCcw className="size-4 text-ios-red" aria-hidden />}
          title="강제 레이아웃 리셋 (localStorage 전체 삭제)"
          onClick={() => {
            localStorage.clear();
            location.reload();
          }}
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
