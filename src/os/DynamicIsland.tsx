import { cn } from '@/utils/cn';
import { ISLAND_COLLAPSED } from './metrics';

export interface DynamicIslandProps {
  className?: string;
  onClick?: () => void;
}

/**
 * CSS version of the Dynamic Island. The pill itself is a plain black capsule;
 * the collapsed size is the value measured from an iPhone 14 Pro screenshot
 * (see ATTRIBUTIONS.md).
 */
export function DynamicIsland({ className, onClick }: DynamicIslandProps) {
  return (
    <div
      onClick={onClick}
      style={{ width: ISLAND_COLLAPSED.width, height: ISLAND_COLLAPSED.height }}
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-full bg-black',
        'ring-1 ring-inset ring-white/[0.06]',
        onClick && 'pointer-events-auto cursor-pointer',
        className,
      )}
      aria-hidden
    >
      {/* camera dot, purely cosmetic */}
      <span className="absolute right-3 top-1/2 size-[6px] -translate-y-1/2 rounded-full bg-[#151515]" />
    </div>
  );
}
