import { motion } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { SPRING_BOUNCY } from '@/utils/motion';
import {
  Bluetooth,
  Flashlight,
  Lock,
  Plane,
  Sun,
  Volume2,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import { sound } from '@/lib/sound';
import { useOSStore } from '@/store/osStore';
import { cn } from '@/utils/cn';
import { SPRING_SOFT } from '@/utils/motion';
import { Wallpaper } from './Wallpaper';

function ControlToggle({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      aria-pressed={active}
      aria-label={label}
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      transition={SPRING_BOUNCY}
      className={cn(
        'relative flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl transition-colors',
        active ? 'bg-ios-accent text-white glow-accent' : 'bg-black/10 text-ios-text dark:bg-white/10',
      )}
    >
      <motion.span
        key={active ? 'on' : 'off'}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={SPRING_BOUNCY}
      >
        <Icon className="size-5" aria-hidden />
      </motion.span>
      <span className="text-[10px] font-medium">{label}</span>
    </motion.button>
  );
}

function ControlSlider({
  label,
  icon: Icon,
  value,
  onChange,
}: {
  label: string;
  icon: LucideIcon;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 rounded-2xl bg-black/10 p-3 text-ios-text dark:bg-white/10">
      <span className="flex items-center gap-1.5 text-[11px] font-medium">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer accent-ios-accent"
      />
    </label>
  );
}

/** Pull-down control centre. Shell only: brightness, volume and quick toggles. */
export function ControlCenter() {
  const controls = useOSStore((s) => s.controls);
  const wifi = useOSStore((s) => s.status.wifi);
  const setControl = useOSStore((s) => s.setControl);
  const setStatus = useOSStore((s) => s.setStatus);
  const setOverlay = useOSStore((s) => s.setOverlay);
  const lock = useOSStore((s) => s.lock);

  const bind = useDrag(
    ({ last, tap, movement: [, my], direction: [, dy], velocity: [, vy] }) => {
      if (!last || tap) return;
      if (my < -40 || (vy > 0.4 && dy < 0)) setOverlay('none');
    },
    { axis: 'y', filterTaps: true, touchAction: 'none' },
  );

  return (
    <motion.div
      initial={{ y: '-100%' }}
      animate={{ y: 0 }}
      exit={{ y: '-100%' }}
      transition={SPRING_SOFT}
      className="absolute inset-0 z-[45] isolate"
    >
      <Wallpaper />
      <div
        className="overlay-veil relative flex h-full w-full flex-col overflow-hidden"
        {...bind()}
      >
        {/* Tapping the background always dismisses the panel. */}
        <button
          type="button"
          aria-label="컨트롤 센터 닫기"
          onClick={() => setOverlay('none')}
          className="absolute inset-0 z-0"
        />
        <div className="scroll-area no-scrollbar relative z-10 flex-1 px-4 pb-10 pt-[calc(var(--ios-statusbar-h)+10px)]">
          <div className="mx-auto grid max-w-sm grid-cols-4 gap-2.5">
            <ControlToggle
              label="비행기"
              icon={Plane}
              active={controls.airplane}
              onClick={() => setControl('airplane', !controls.airplane)}
            />
            <ControlToggle
              label="Wi-Fi"
              icon={Wifi}
              active={wifi}
              onClick={() => setStatus({ wifi: !wifi })}
            />
            <ControlToggle
              label="블루투스"
              icon={Bluetooth}
              active={controls.bluetooth}
              onClick={() => setControl('bluetooth', !controls.bluetooth)}
            />
            <ControlToggle
              label="손전등"
              icon={Flashlight}
              active={controls.flashlight}
              onClick={() => setControl('flashlight', !controls.flashlight)}
            />

            <div className="col-span-4 grid grid-cols-2 gap-2.5">
              <ControlSlider
                label="밝기"
                icon={Sun}
                value={controls.brightness}
                onChange={(value) => setControl('brightness', value)}
              />
              <ControlSlider
                label="볼륨"
                icon={Volume2}
                value={controls.volume}
                onChange={(value) => {
                  setControl('volume', value);
                  sound.setVolume(value);
                }}
              />
            </div>

            <motion.button
              type="button"
              onClick={lock}
              whileTap={{ scale: 0.97 }}
              transition={SPRING_BOUNCY}
              className="col-span-4 flex h-12 items-center justify-center gap-2 rounded-2xl bg-black/10 text-[15px] font-semibold text-ios-text dark:bg-white/10"
            >
              <Lock className="size-4" aria-hidden />
              잠금 화면으로
            </motion.button>
          </div>

          <p className="mt-4 text-center text-[11px] text-ios-muted">
            컨트롤센터는 껍데기입니다. 밝기를 제외한 값은 아직 게임에 영향을 주지 않습니다.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
