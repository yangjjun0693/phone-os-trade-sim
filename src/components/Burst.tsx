import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/utils/cn';

const DEFAULT_COLORS = ['#34c759', '#0a84ff', '#ff9f0a', '#ff3b30', '#af52de', '#ffffff'];

interface BurstProps {
  show: boolean;
  className?: string;
  colors?: string[];
  count?: number;
  radius?: number;
  duration?: number;
}

/**
 * A one-shot particle burst for wins, sales and other "good news" moments.
 * Particle geometry is derived from the index (no randomness) so the effect is
 * deterministic and cheap.
 */
export function Burst({
  show,
  className,
  colors = DEFAULT_COLORS,
  count = 18,
  radius = 74,
  duration = 0.8,
}: BurstProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2 + (index % 2 === 0 ? 0.35 : -0.35);
        const distance = radius * (0.55 + ((index * 37) % 45) / 100);
        return {
          index,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          size: 4 + (index % 3) * 2.5,
          color: colors[index % colors.length],
          delay: (index % 5) * 0.02,
        };
      }),
    [count, colors, radius],
  );

  return (
    <AnimatePresence>
      {show ? (
        <span
          className={cn('pointer-events-none absolute left-1/2 top-1/2 z-30', className)}
          aria-hidden
        >
          {particles.map((particle) => (
            <motion.span
              key={particle.index}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.3 }}
              animate={{ x: particle.x, y: particle.y, opacity: 0, scale: 1 }}
              transition={{ duration, ease: 'easeOut', delay: particle.delay }}
              className="absolute rounded-full"
              style={{
                width: particle.size,
                height: particle.size,
                marginLeft: -particle.size / 2,
                marginTop: -particle.size / 2,
                background: particle.color,
              }}
            />
          ))}
        </span>
      ) : null}
    </AnimatePresence>
  );
}
