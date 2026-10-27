import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Bell, Check, Volume2 } from 'lucide-react';
import {
  IDENTITY_OPTIONS,
  INTRO_FINAL,
  INTRO_GREETINGS,
  SETUP_COPY,
} from '@/content/tutorial';
import { introFinalLine } from '@/game/tutorial';
import { sound } from '@/lib/sound';
import { useGameStore } from '@/store/gameStore';
import { useOSStore } from '@/store/osStore';
import { useTutorialStore } from '@/store/tutorialStore';
import { cn } from '@/utils/cn';
import { haptic } from '@/utils/haptics';
import { EASE_IOS, SPRING_SOFT, prefersReducedMotion } from '@/utils/motion';

type Screen = 'intro' | 'name' | 'identity' | 'device' | 'consent';
const SCREENS: Exclude<Screen, 'intro'>[] = ['name', 'identity', 'device', 'consent'];

/** Must stay in sync with the greeting transition below (handwriting wipe). */
const GREETING_ENTER_MS = 600;
const GREETING_EXIT_MS = 260;

/** 밝은 버튼 하나로 끝나는 설정 마법사. 값은 마지막에 한 번에 커밋합니다. */
export function Onboarding() {
  const reduced = prefersReducedMotion();
  const playerName = useGameStore((s) => s.playerName);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const completeSetup = useTutorialStore((s) => s.completeSetup);
  const defaultIdentity = useTutorialStore((s) => s.defaultIdentity);
  const unlock = useOSStore((s) => s.unlock);

  const [screen, setScreen] = useState<Screen>('intro');
  const [greetIndex, setGreetIndex] = useState(0);
  const [name, setName] = useState(playerName);
  const [identity, setIdentity] = useState(defaultIdentity);
  const [device, setDevice] = useState(`${playerName}의 iPhone`);
  const [notifications, setNotifications] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const deviceTouched = useRef(false);

  /** 인사말 → 마지막 문구 → 이름 입력. 타이머는 화면이 바뀌면 정리됩니다. */
  useEffect(() => {
    if (screen !== 'intro') return;
    if (greetIndex > INTRO_GREETINGS.length) {
      setScreen('name');
      return;
    }
    const isFinal = greetIndex === INTRO_GREETINGS.length;
    const visibleFor = isFinal ? 1200 : INTRO_GREETINGS[greetIndex].hold;
    // `AnimatePresence mode="wait"` first plays the outgoing word for EXIT_MS,
    // then mounts the next one and draws it during ENTER_MS. Content's `hold`
    // therefore measures the fully-drawn pause; add the transition overhead so
    // every language (not just the first) gets the same reading time.
    const wait = reduced ? visibleFor : visibleFor + GREETING_ENTER_MS + GREETING_EXIT_MS;
    const timer = window.setTimeout(() => setGreetIndex((index) => index + 1), wait);
    return () => window.clearTimeout(timer);
  }, [screen, greetIndex, reduced]);

  const trimmed = name.trim();
  const stepNumber = screen === 'intro' ? 0 : SCREENS.indexOf(screen);

  const next = () => {
    haptic(6);
    if (screen === 'name') {
      if (!trimmed) return;
      setPlayerName(trimmed);
      if (!deviceTouched.current) setDevice(`${trimmed}의 iPhone`);
      setScreen('identity');
      return;
    }
    if (screen === 'identity') {
      setScreen('device');
      return;
    }
    if (screen === 'device') {
      setScreen('consent');
      return;
    }
    if (screen === 'consent') {
      setPlayerName(trimmed || playerName);
      completeSetup({
        deviceName: device.trim() || `${trimmed || playerName}의 iPhone`,
        defaultIdentity: identity,
        notifications,
        sound: soundOn,
      });
      sound.setEnabled(soundOn);
      haptic(12);
      // Setup is the iOS "hello" flow: it ends on the home screen, not on a
      // lock screen the player has to swipe away right after naming the phone.
      unlock();
    }
  };

  const back = () => {
    haptic(4);
    if (screen === 'identity') setScreen('name');
    else if (screen === 'device') setScreen('identity');
    else if (screen === 'consent') setScreen('device');
  };

  const skip = () => {
    haptic(6);
    completeSetup({
      deviceName: device.trim() || `${trimmed || playerName}의 iPhone`,
      defaultIdentity: identity,
      notifications,
      sound: soundOn,
    });
    sound.setEnabled(soundOn);
    unlock();
  };

  const greeting = useMemo(
    () => (greetIndex < INTRO_GREETINGS.length ? INTRO_GREETINGS[greetIndex] : null),
    [greetIndex],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0.01 : 0.35, ease: EASE_IOS }}
      className="absolute inset-0 z-[70] overflow-hidden bg-black text-white"
    >
      {/* 부드러운 조명. 순수 장식이라 탭을 막지 않습니다. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 size-[320px] rounded-full bg-ios-accent/25 blur-[90px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-20 size-[340px] rounded-full bg-ios-purple/20 blur-[100px]"
      />

      {screen === 'intro' ? (
        <div key="intro" className="relative flex h-full flex-col">
          <div className="flex justify-end px-5 pt-[calc(var(--ios-statusbar-h)+8px)]">
            <button
              type="button"
              onClick={() => {
                haptic(4);
                setScreen('name');
              }}
              className="rounded-full px-3 py-1.5 text-[13px] font-medium text-white/55 active:text-white/90"
            >
              건너뛰기
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={greetIndex}
                initial={
                  reduced
                    ? undefined
                    : greeting
                      ? {
                          opacity: 0,
                          y: 10,
                          clipPath:
                            greeting.script === 'arabic'
                              ? 'inset(0 0 0 100%)'
                              : 'inset(0 100% 0 0)',
                        }
                      : { opacity: 0, y: 10 }
                }
                animate={{ opacity: 1, y: 0, ...(greeting ? { clipPath: 'inset(0 0% 0 0)' } : {}) }}
                exit={
                  reduced
                    ? undefined
                    : {
                        opacity: 0,
                        y: -12,
                        filter: 'blur(6px)',
                        transition: { duration: GREETING_EXIT_MS / 1000, ease: EASE_IOS },
                      }
                }
                transition={{ duration: reduced ? 0.01 : GREETING_ENTER_MS / 1000, ease: EASE_IOS }}
                className="text-center"
              >
                {greeting ? (
                  <>
                    {/* Apple draws each hello by hand; these OFL faces keep that
                        written feel instead of falling back to the UI sans. */}
                    <p
                      className="hello-word"
                      data-script={greeting.script}
                      lang={greeting.langTag}
                      dir={greeting.script === 'arabic' ? 'rtl' : 'ltr'}
                    >
                      {greeting.text}
                    </p>
                    <p
                      className="hello-lang mt-5 h-4 text-[11px] text-white/35"
                      data-script={greeting.script}
                      lang={greeting.langTag}
                    >
                      {greeting.lang}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[34px] font-semibold leading-tight tracking-tight">
                      {introFinalLine(INTRO_FINAL, trimmed || playerName)}
                    </p>
                    <p className="mt-4 h-4" />
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-1.5 pb-12">
            {INTRO_GREETINGS.map((_, index) => (
              <span
                key={index}
                className={cn(
                  'h-1 rounded-full transition-all duration-300',
                  index === greetIndex ? 'w-5 bg-white/80' : 'w-1 bg-white/25',
                )}
              />
            ))}
          </div>
        </div>
      ) : (
        <div key="setup" className="relative flex h-full flex-col">
          <header className="flex items-center justify-between px-4 pt-[calc(var(--ios-statusbar-h)+6px)]">
            <button
              type="button"
              aria-label="뒤로"
              onClick={back}
              disabled={screen === 'name'}
              className="flex size-10 items-center justify-center rounded-full text-white/80 disabled:opacity-0"
            >
              <ArrowLeft className="size-5" aria-hidden />
            </button>
            <div className="flex items-center gap-1.5" aria-hidden>
              {SCREENS.map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    'h-1 rounded-full transition-all duration-300',
                    index <= stepNumber ? 'w-5 bg-white/80' : 'w-1 bg-white/25',
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={skip}
              className="flex h-10 items-center rounded-full px-2 text-[13px] font-medium text-white/55 active:text-white/90"
            >
              건너뛰기
            </button>
          </header>

          <div className="flex flex-1 flex-col overflow-y-auto px-7 pb-6 pt-10">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={screen}
                initial={reduced ? undefined : { opacity: 0, x: 26 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduced ? undefined : { opacity: 0, x: -26 }}
                transition={{ duration: reduced ? 0.01 : 0.26, ease: EASE_IOS }}
                className="flex flex-1 flex-col"
              >
                {screen === 'name' ? (
                  <>
                    <Eyebrow>{SETUP_COPY.name.eyebrow}</Eyebrow>
                    <Title>{SETUP_COPY.name.title}</Title>
                    <Body>{SETUP_COPY.name.body}</Body>
                    <input
                      aria-label="이름"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') next();
                      }}
                      maxLength={20}
                      autoFocus
                      placeholder={SETUP_COPY.name.placeholder}
                      className="mt-8 w-full border-b-2 border-white/25 bg-transparent pb-3 text-[28px] font-semibold tracking-tight text-white placeholder:text-white/25 focus:border-white/70 focus:outline-none"
                    />
                  </>
                ) : null}

                {screen === 'identity' ? (
                  <>
                    <Eyebrow>{SETUP_COPY.identity.eyebrow}</Eyebrow>
                    <Title>{SETUP_COPY.identity.title}</Title>
                    <Body>{SETUP_COPY.identity.body}</Body>
                    <div className="mt-7 flex flex-col gap-3">
                      {IDENTITY_OPTIONS.map((option) => {
                        const selected = identity === option.value;
                        return (
                          <motion.button
                            key={option.value}
                            type="button"
                            whileTap={reduced ? undefined : { scale: 0.985 }}
                            onClick={() => {
                              haptic(5);
                              setIdentity(option.value);
                            }}
                            aria-pressed={selected}
                            className={cn(
                              'flex w-full items-start gap-3 rounded-2xl p-4 text-left ring-1 transition-colors',
                              selected
                                ? 'bg-white text-black ring-white'
                                : 'bg-white/[0.06] text-white ring-white/15',
                            )}
                          >
                            <span
                              className={cn(
                                'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full',
                                selected ? 'bg-black text-white' : 'bg-white/10 text-white/50',
                              )}
                            >
                              {selected ? <Check className="size-3.5" aria-hidden /> : null}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-2">
                                <span className="text-[17px] font-semibold">{option.title}</span>
                                <span className={cn('text-[11px]', selected ? 'text-black/50' : 'text-white/40')}>
                                  {option.hint}
                                </span>
                              </span>
                              <span className={cn('mt-1 block text-[13px]', selected ? 'text-black/65' : 'text-white/60')}>
                                {option.body}
                              </span>
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </>
                ) : null}

                {screen === 'device' ? (
                  <>
                    <Eyebrow>{SETUP_COPY.device.eyebrow}</Eyebrow>
                    <Title>{SETUP_COPY.device.title}</Title>
                    <Body>{SETUP_COPY.device.body}</Body>
                    <input
                      aria-label="기기 이름"
                      value={device}
                      onChange={(event) => {
                        deviceTouched.current = true;
                        setDevice(event.target.value);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') next();
                      }}
                      maxLength={32}
                      placeholder={`${trimmed || playerName}의 iPhone`}
                      className="mt-8 w-full border-b-2 border-white/25 bg-transparent pb-3 text-[24px] font-semibold tracking-tight text-white placeholder:text-white/25 focus:border-white/70 focus:outline-none"
                    />
                    <p className="mt-3 text-[12px] text-white/35">나중에 설정에서 바꿀 수 있습니다.</p>
                  </>
                ) : null}

                {screen === 'consent' ? (
                  <>
                    <Eyebrow>{SETUP_COPY.consent.eyebrow}</Eyebrow>
                    <Title>{SETUP_COPY.consent.title}</Title>
                    <Body>{SETUP_COPY.consent.body}</Body>
                    <div className="mt-7 flex flex-col gap-3">
                      <ConsentRow
                        icon={<Bell className="size-4" aria-hidden />}
                        label="알림"
                        description="택배 도착, 메시지, 거래 마감을 알려줍니다."
                        checked={notifications}
                        onChange={setNotifications}
                      />
                      <ConsentRow
                        icon={<Volume2 className="size-4" aria-hidden />}
                        label="소리"
                        description="탭·성공·실패 효과음을 켭니다."
                        checked={soundOn}
                        onChange={setSoundOn}
                      />
                    </div>
                    <p className="mt-5 text-[12px] leading-relaxed text-white/40">
                      이 게임의 모든 인물·시장·수치는 허구입니다. 실제 거래나 수법을 안내하지 않습니다.
                    </p>
                  </>
                ) : null}
              </motion.div>
            </AnimatePresence>

            <motion.button
              type="button"
              onClick={next}
              disabled={screen === 'name' && !trimmed}
              whileTap={reduced ? undefined : { scale: 0.98 }}
              transition={SPRING_SOFT}
              className="mt-8 flex h-[54px] w-full shrink-0 items-center justify-center rounded-2xl bg-white text-[17px] font-semibold text-black disabled:opacity-30"
            >
              {screen === 'consent' ? SETUP_COPY.consent.cta : SETUP_COPY[screen].cta}
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-ios-accent">{children}</p>;
}

function Title({ children }: { children: React.ReactNode }) {
  return <h1 className="mt-3 text-[30px] font-bold leading-tight tracking-tight">{children}</h1>;
}

function Body({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-[14px] leading-relaxed text-white/60">{children}</p>;
}

function ConsentRow({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3.5 ring-1 ring-white/10">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">{label}</span>
        <span className="mt-0.5 block text-[12px] text-white/50">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => {
          haptic(5);
          onChange(!checked);
        }}
        className={cn(
          'relative h-8 w-[52px] shrink-0 rounded-full transition-colors',
          checked ? 'bg-ios-green' : 'bg-white/20',
        )}
      >
        <motion.span
          layout
          transition={SPRING_SOFT}
          className={cn(
            'absolute top-0.5 size-7 rounded-full bg-white shadow',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  );
}
