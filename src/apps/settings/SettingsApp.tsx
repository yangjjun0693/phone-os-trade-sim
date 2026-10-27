import { useRef, useState, useMemo } from 'react';
import { Bell, BookOpen, Cloud, Download, Info, Moon, Play, RotateCcw, Smartphone, Sun, Upload, Shield, LogOut, ChevronRight, Volume2 } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { SAVE_VERSION, SaveDataSchema, localSaveService, type SaveData } from '@/lib/saveService';
import { sound } from '@/lib/sound';
import { TUTORIAL_STEPS } from '@/content/tutorial';
import { useGameStore, type SteakState } from '@/store/gameStore';
import { useOSStore } from '@/store/osStore';
import { useTutorialStore } from '@/store/tutorialStore';
import { computeTotalExposure, getExposureTier, getExposureTierColor, getIdentityLabel, getSupportedIdentities, getAppIdentity, type IdentityKind } from '@/game';
import type { InventoryItem, ThemeMode, IdentityState } from '@/types';
import { cn } from '@/utils/cn';
import { AnimatedNumber, Pill, Segmented } from '@/components';
import { CLOCK_PRESETS, MINUTES_PER_TICK } from '@/content/time';
import { AppShell } from '../AppShell';
import { Row, Section } from '../SectionList';
import { getApp } from '../registry';
import { SPRING_BOUNCY, SPRING_SNAPPY, prefersReducedMotion } from '@/utils/motion';
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
      <motion.span
        layout
        transition={SPRING_BOUNCY}
        className={cn(
          'absolute top-0.5 size-7 rounded-full bg-white shadow',
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
      playerName: game.playerName,
      cash: game.cash,
      heat: game.heat,
      day: game.day,
      gameDateTime: game.gameDateTime,
      inventory: game.inventory,
      steak: game.steak,
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
                    : 'bg-ios-separator/20 text-ios-muted'
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
                    : 'bg-ios-separator/20 text-ios-muted'
                )}
              >
                별명
              </button>
            </>
          )}
          {identity.loggedIn && (
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-ios-muted"
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
  const [editingDevice, setEditingDevice] = useState(false);
  const [deviceDraft, setDeviceDraft] = useState('');

  const theme = useOSStore((s) => s.theme);
  const setTheme = useOSStore((s) => s.setTheme);
  const clockSpeed = useOSStore((s) => s.clockSpeed);
  const setClockSpeed = useOSStore((s) => s.setClockSpeed);
  const resetLayout = useOSStore((s) => s.resetLayout);
  const goHome = useOSStore((s) => s.goHome);

  const guideActive = useTutorialStore((s) => s.active);
  const guideDone = useTutorialStore((s) => s.done);
  const deviceName = useTutorialStore((s) => s.deviceName);
  const defaultIdentity = useTutorialStore((s) => s.defaultIdentity);
  const notificationsOn = useTutorialStore((s) => s.notifications);
  const soundOn = useTutorialStore((s) => s.sound);
  const startGuide = useTutorialStore((s) => s.startGuide);
  const restartGuide = useTutorialStore((s) => s.restartGuide);
  const stopGuide = useTutorialStore((s) => s.stopGuide);
  const setDeviceName = useTutorialStore((s) => s.setDeviceName);
  const setDefaultIdentity = useTutorialStore((s) => s.setDefaultIdentity);
  const setNotifications = useTutorialStore((s) => s.setNotifications);
  const setSound = useTutorialStore((s) => s.setSound);

  const playerName = useGameStore((s) => s.playerName);
  const day = useGameStore((s) => s.day);
  const identities = useGameStore(s => s.identities);
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
          playerName?: string;
          cash?: number;
          heat?: number;
          day?: number;
          gameDateTime?: string;
          inventory?: InventoryItem[];
          steak?: SteakState;
        };
        os?: { theme?: ThemeMode; layout?: ReturnType<typeof useOSStore.getState>['layout'] };
      };

      const gameStore = useGameStore.getState();
      if (typeof game?.playerName === 'string') gameStore.setPlayerName(game.playerName);
      if (typeof game?.cash === 'number') gameStore.setCash(game.cash);
      if (typeof game?.heat === 'number') gameStore.setHeat(game.heat);
      if (Array.isArray(game?.inventory)) gameStore.setInventory(game.inventory);
      if (game?.steak && typeof game.steak.chips === 'number' && Array.isArray(game.steak.bets)) {
        gameStore.setSteak(game.steak);
      }

      if (os?.theme) setTheme(os.theme);
      if (os?.layout) useOSStore.getState().setLayout(os.layout);

      setMessage('세이브를 불러왔습니다.');
    } catch {
      setMessage('세이브를 읽지 못했습니다.');
    }
  };

  return (
    <AppShell title="설정" largeTitle>
      <Section header="프로필" footer="이름은 이 기기 안의 가상 플레이어 정보입니다.">
        <div className="flex items-center gap-3 px-4 py-3">
          <motion.div
            initial={{ scale: 0.7, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={SPRING_BOUNCY}
            className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-ios-accent to-ios-purple text-[19px] font-semibold text-white shadow-sm"
          >
            <span className="relative">{playerName.slice(0, 1)}</span>
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-semibold">{playerName}</p>
            <p className="text-[12px] text-ios-muted">가상 신원 · Day {day}</p>
          </div>
          <Pill tone="green">플레이어</Pill>
        </div>
      </Section>

      <Section
        header="가이드"
        footer="가이드는 게임을 막지 않습니다. 홈 화면에서만 뜨고, 앱을 열면 잠시 사라집니다."
        delay={0.03}
      >
        <Row
          icon={<BookOpen className="size-4 text-ios-accent" aria-hidden />}
          title="플레이 가이드 다시 보기"
          subtitle={`${guideDone.length} / ${TUTORIAL_STEPS.length} 단계 완료`}
          value={guideActive ? '표시 중' : '꺼짐'}
          onClick={() => {
            restartGuide();
            goHome();
          }}
        />
        {guideActive ? (
          <Row
            icon={<Play className="size-4 text-ios-muted" aria-hidden />}
            title="가이드 끄기"
            subtitle="홈 화면의 안내 카드를 숨깁니다."
            onClick={stopGuide}
          />
        ) : (
          <Row
            icon={<Play className="size-4 text-ios-green" aria-hidden />}
            title="가이드 켜기"
            subtitle="이어서 진행합니다."
            onClick={() => {
              startGuide();
              goHome();
            }}
          />
        )}
        {editingDevice ? (
          <div className="flex items-center gap-2 border-b border-ios-separator/15 px-4 py-2.5 last:border-b-0">
            <input
              aria-label="기기 이름 입력"
              value={deviceDraft}
              autoFocus
              maxLength={32}
              onChange={(event) => setDeviceDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  setDeviceName(deviceDraft);
                  setEditingDevice(false);
                }
                if (event.key === 'Escape') setEditingDevice(false);
              }}
              className="min-w-0 flex-1 rounded-xl bg-ios-bg px-3 py-2 text-[15px] ring-1 ring-ios-separator/30 focus:outline-none focus:ring-app"
            />
            <button
              type="button"
              onClick={() => {
                setDeviceName(deviceDraft);
                setEditingDevice(false);
              }}
              className="shrink-0 rounded-xl bg-app px-3 py-2 text-[13px] font-semibold text-white"
            >
              저장
            </button>
          </div>
        ) : (
          <Row
            icon={<Smartphone className="size-4 text-ios-blue" aria-hidden />}
            title="기기 이름"
            value={deviceName}
            onClick={() => {
              setDeviceDraft(deviceName);
              setEditingDevice(true);
            }}
          />
        )}
        <div className="border-b border-ios-separator/15 px-4 py-3 last:border-b-0">
          <p className="mb-2 text-[13px] text-ios-muted">가이드가 추천하는 주 신원</p>
          <Segmented
            options={[
              { value: 'alias' as IdentityKind, label: '별명' },
              { value: 'realname' as IdentityKind, label: '실명' },
            ]}
            value={defaultIdentity}
            onChange={setDefaultIdentity}
            tone="surface"
            className="rounded-xl p-0.5"
          />
        </div>
        <Row
          icon={<Bell className="size-4 text-ios-orange" aria-hidden />}
          title="알림"
          subtitle="잠금 화면과 알림 센터에 표시합니다."
          trailing={
            <Toggle
              label="알림"
              checked={notificationsOn}
              onChange={setNotifications}
            />
          }
        />
        <Row
          icon={<Volume2 className="size-4 text-ios-purple" aria-hidden />}
          title="소리"
          subtitle="탭·성공·실패 효과음을 켭니다."
          trailing={
            <Toggle
              label="소리"
              checked={soundOn}
              onChange={(next) => {
                setSound(next);
                sound.setEnabled(next);
              }}
            />
          }
        />
      </Section>

      <Section header="신원 관리" footer="각 앱별로 사용할 신원(실명/별명)을 선택하세요. 노출도는 게임 내 가상 수치입니다." delay={0.05}>
        {/* Exposure Summary */}
        <motion.div
          initial={prefersReducedMotion() ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING_SNAPPY}
          className="relative mx-4 mb-4 overflow-hidden rounded-2xl p-4 ring-1 ring-black/5 dark:ring-white/5"
          style={{ background: `linear-gradient(135deg, ${exposureBgColor}/20, ${exposureBgColor}/5)` }}
        >
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-ios-muted">총 노출도</p>
              <span style={{ color: `var(--ios-${exposureTextColor})` }}>
                <AnimatedNumber value={totalExposure} className="mt-1 block text-[28px] font-bold" />
              </span>
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

      <Section header="화면" delay={0.1}>
        <div className="px-4 py-3">
          <p className="mb-2 text-[13px] text-ios-muted">게임 시계</p>
          <Segmented
            options={CLOCK_PRESETS.map((preset) => ({
              value: preset.id,
              label: `${preset.label} · ${preset.realMinutesPerDay}분`,
            }))}
            value={clockSpeed}
            onChange={setClockSpeed}
            tone="surface"
            className="rounded-xl p-0.5"
          />
          <p className="mt-2 text-[12px] text-ios-muted">
            하루(24시간)가 걸리는 실시간 시간입니다. 시계는 {MINUTES_PER_TICK}분 단위로 움직입니다.
          </p>
        </div>

        <div className="px-4 py-3">
          <p className="mb-2 text-[13px] text-ios-muted">테마</p>
          <Segmented
            options={THEME_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            value={theme}
            onChange={setTheme}
            tone="surface"
            className="rounded-xl p-0.5"
          />
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

      <Section header="저장" footer="실제 키는 커밋되지 않습니다. .env.example를 참고하세요." delay={0.15}>
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

      <Section header="정보" delay={0.2}>
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
