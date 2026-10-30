import { Star } from 'lucide-react';
import { cn } from '@/utils/cn';
import { AMASON_ORANGE, AMASON_YELLOW } from './theme';

/** Star row, drawn from the numeric rating (dim stars stand in for "half"). */
export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn('flex items-center gap-[1px]', className)} aria-hidden>
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.max(0, Math.min(1, rating - index));
        return (
          <Star
            key={index}
            className="size-3 text-[#ffa41c]"
            strokeWidth={1.4}
            fill="currentColor"
            fillOpacity={fill > 0.75 ? 1 : fill > 0.25 ? 0.45 : 0.12}
          />
        );
      })}
    </span>
  );
}

/** The storefront's own buttons: yellow to add, orange to buy, grey for the rest. */
export function CtaButton({
  children,
  tone = 'yellow',
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'yellow' | 'orange' | 'plain' }) {
  return (
    <button
      type="button"
      {...rest}
      style={{
        backgroundColor:
          tone === 'yellow' ? AMASON_YELLOW : tone === 'orange' ? AMASON_ORANGE : '#eef0f3',
        color: '#0f1111',
      }}
      className={cn(
        'flex h-10 items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-semibold shadow-sm transition active:scale-[0.97] disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
}
