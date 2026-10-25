import { motion } from 'framer-motion';
import { RotateCcw, Skull, Trophy } from 'lucide-react';
import { Burst } from '@/components';
import { MAX_DAYS, RETIRE_GOAL, totalWealth } from '@/game/trade';
import { SPRING_BOUNCY, SPRING_SOFT } from '@/utils/motion';
import { useGameStore } from '@/store/gameStore';
import { useOSStore } from '@/store/osStore';
import { formatCash } from '@/utils/format';

/**
 * Full-screen run result. Sits above the OS chrome so a bust or retirement
 * cannot be missed, and offers a clean restart.
 */
export function GameStatusOverlay() {
  const status = useGameStore((s) => s.status);
  const reason = useGameStore((s) => s.statusReason);
  const playerName = useGameStore((s) => s.playerName);
  const cash = useGameStore((s) => s.cash);
  const bankBalance = useGameStore((s) => s.bank.balance);
  const day = useGameStore((s) => s.day);
  const stats = useGameStore((s) => s.stats);
  const restartGame = useGameStore((s) => s.restartGame);
  const goHome = useOSStore((s) => s.goHome);

  if (status === 'playing') return null;

  const won = status === 'retired';
  const wealth = totalWealth(cash, bankBalance);

  const restart = () => {
    restartGame();
    goHome();
  };

  return (
    <div
      className="absolute inset-0 z-[90] flex flex-col items-center justify-center overflow-y-auto bg-[#0b0b0d] px-6 py-10 text-white"
      role="dialog"
      aria-modal="true"
      aria-label={won ? '게임 클리어' : '게임 오버'}
    >
      <div className="relative">
        <Burst show={won} radius={120} count={24} duration={1.1} />
        <motion.div
          initial={{ scale: 0.4, opacity: 0, rotate: -16 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ ...SPRING_BOUNCY, delay: 0.05 }}
          className={`flex size-20 items-center justify-center rounded-full ${
            won ? 'bg-emerald-400/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
          }`}
        >
          {won ? <Trophy className="size-10" aria-hidden /> : <Skull className="size-10" aria-hidden />}
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_SOFT, delay: 0.12 }}
        className="mt-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-white/50"
      >
        {won ? 'Retired' : 'Busted'}
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_SOFT, delay: 0.16 }}
        className="mt-1 text-center text-[28px] font-extrabold tracking-tight"
      >
        {won ? '은퇴 성공' : '판이 끝났다'}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_SOFT, delay: 0.2 }}
        className="mt-2 max-w-[300px] text-center text-[14px] leading-relaxed text-white/70"
      >
        {reason || (won ? '목표 금액을 채웠다.' : '더 이상 버틸 수 없다.')}
      </motion.p>

      <div className="mt-6 w-full max-w-[320px] rounded-2xl bg-white/5 p-4 ring-1 ring-inset ring-white/10">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] text-white/60">{playerName}의 최종 재산</span>
          <span className="text-[20px] font-bold tabular-nums">{formatCash(wealth)}</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between text-[11px] text-white/45">
          <span>
            현금 {formatCash(cash)} · 예금 {formatCash(bankBalance)}
          </span>
          <span>
            Day {Math.min(day, MAX_DAYS)} / {MAX_DAYS}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-black/25 py-2">
            <p className="text-[10px] uppercase tracking-wide text-white/40">판매</p>
            <p className="mt-0.5 text-[15px] font-semibold tabular-nums">{stats.sales}</p>
          </div>
          <div className="rounded-xl bg-black/25 py-2">
            <p className="text-[10px] uppercase tracking-wide text-white/40">매출</p>
            <p className="mt-0.5 text-[15px] font-semibold tabular-nums">
              {formatCash(stats.revenue)}
            </p>
          </div>
          <div className="rounded-xl bg-black/25 py-2">
            <p className="text-[10px] uppercase tracking-wide text-white/40">잠복</p>
            <p className="mt-0.5 text-[15px] font-semibold tabular-nums">{stats.stings}</p>
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] text-white/35">
          목표 {formatCash(RETIRE_GOAL)} · 전부 허구의 게임입니다
        </p>
      </div>

      <button
        type="button"
        onClick={restart}
        className="mt-6 flex h-12 w-full max-w-[320px] items-center justify-center gap-2 rounded-2xl bg-white text-[15px] font-bold text-black active:opacity-80"
      >
        <RotateCcw className="size-4" aria-hidden />
        새 게임 시작
      </button>
    </div>
  );
}
