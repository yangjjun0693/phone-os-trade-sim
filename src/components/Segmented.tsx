import { useId, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { SPRING_SNAPPY } from '@/utils/motion';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  /** `fill` stretches evenly; `scroll` keeps natural width and scrolls. */
  layout?: 'fill' | 'scroll';
  tone?: 'solid' | 'surface' | 'accent';
}

type Tone = NonNullable<SegmentedProps<string>['tone']>;

const ACTIVE_BG: Record<Tone, string> = {
  solid: 'bg-ios-text',
  surface: 'bg-ios-surface shadow-sm',
  accent: 'bg-ios-accent',
};

const ACTIVE_TEXT: Record<Tone, string> = {
  solid: 'text-ios-bg',
  surface: 'text-ios-text',
  accent: 'text-white',
};

/**
 * A segmented control whose highlight slides between options with a shared
 * layout animation — the little "pill" that follows your finger.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  layout = 'fill',
  tone = 'solid',
}: SegmentedProps<T>) {
  const id = useId();
  const scroll = layout === 'scroll';

  return (
    <div
      className={cn(
        'relative flex gap-1',
        scroll
          ? 'no-scrollbar overflow-x-auto'
          : 'rounded-full bg-ios-separator/15 p-1',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative z-10 flex items-center justify-center gap-1.5 rounded-full font-medium',
              scroll ? 'shrink-0 px-3.5 py-1.5 text-[13px]' : 'flex-1 px-3 py-1.5 text-[13px]',
              !active && 'text-ios-muted',
            )}
          >
            {active ? (
              <motion.span
                layoutId={`segmented-${id}`}
                transition={SPRING_SNAPPY}
                className={cn('absolute inset-0 rounded-full', ACTIVE_BG[tone])}
              />
            ) : null}
            <span
              className={cn(
                'relative flex items-center gap-1.5',
                active && ACTIVE_TEXT[tone],
              )}
            >
              {option.icon}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
