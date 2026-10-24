import type { ReactNode } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const PHONE_WIDTH = 430;
/** 430 × 931 ≈ 9 : 19.5 */
const PHONE_HEIGHT = 931;

/**
 * On phones the OS fills the viewport (100dvh, safe-area aware). On wider
 * screens the same tree is placed inside a bezel so the game is frameless on
 * mobile and photogenic on desktop.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (!isDesktop) {
    return (
      <div className="relative h-[100dvh] w-full overflow-hidden bg-ios-bg">{children}</div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center p-6">
      <div
        className="relative shrink-0"
        style={{
          width: PHONE_WIDTH,
          height: `min(${PHONE_HEIGHT}px, calc(100dvh - 48px))`,
        }}
      >
        {/* titanium-ish bezel */}
        <div className="absolute -inset-[13px] rounded-[64px] bg-gradient-to-b from-[#3a3a3e] to-[#0b0b0d] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]" />
        <div className="absolute -inset-[13px] rounded-[64px] ring-1 ring-inset ring-white/10" />
        {/* side buttons */}
        <div className="absolute -left-[15px] top-[150px] h-8 w-[3px] rounded-l bg-[#2a2a2e]" />
        <div className="absolute -left-[15px] top-[210px] h-14 w-[3px] rounded-l bg-[#2a2a2e]" />
        <div className="absolute -left-[15px] top-[280px] h-14 w-[3px] rounded-l bg-[#2a2a2e]" />
        <div className="absolute -right-[15px] top-[230px] h-20 w-[3px] rounded-r bg-[#2a2a2e]" />

        {/* screen */}
        <div className="relative h-full w-full overflow-hidden rounded-[52px] bg-ios-bg">
          {children}
        </div>
      </div>
    </div>
  );
}
