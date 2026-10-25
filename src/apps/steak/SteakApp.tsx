import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownToLine, ArrowUpFromLine, Coins, Dices, Rocket, X } from 'lucide-react';
import { AnimatedNumber, Burst } from '@/components';
import { CHIP_QUICK_AMOUNTS } from '@/content/economy';
import {
  COINFLIP_MULTIPLIER,
  clampCrashTarget,
  clampDiceTarget,
  diceMultiplier,
  diceWinChance,
  type CoinSide,
  type DiceDirection,
  type SteakBet,
  type SteakGameId,
  type SteakOutcome,
} from '@/game/steak';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/utils/cn';
import { formatCash, formatChips, formatShortDate } from '@/utils/format';
import { haptic } from '@/utils/haptics';
import { SPRING_SNAPPY, prefersReducedMotion } from '@/utils/motion';
import { SteakIcon } from '../icons';

const GAME_TABS = [
  { id: 'coinflip' as const, label: '코인플립', Icon: Coins },
  { id: 'dice' as const, label: '주사위', Icon: Dices },
  { id: 'crash' as const, label: '크래시', Icon: Rocket },
];

const GAME_LABEL: Record<SteakGameId, string> = {
  coinflip: '코인플립',
  dice: '주사위',
  crash: '크래시',
};

const BET_QUICK = CHIP_QUICK_AMOUNTS;
const CASH_QUICK = CHIP_QUICK_AMOUNTS;
const CRASH_PRESETS = [1.5, 2, 3, 5, 10];

function parseAmount(text: string): number {
  return Number(text.replace(/[^0-9]/g, '')) || 0;
}

/**
 * steak — a Stake-style crypto-casino parody.
 *
 * Everything is fictional game currency: cash can be swapped for chips, chips
 * can be swapped back, and three tiny games settle instantly. No real money,
 * crypto or gambling mechanics are involved.
 */
export function SteakApp() {
  const playerName = useGameStore((s) => s.playerName);
  const cash = useGameStore((s) => s.cash);
  const chips = useGameStore((s) => s.steak.chips);
  const bets = useGameStore((s) => s.steak.bets);
  const deposit = useGameStore((s) => s.steakDeposit);
  const withdraw = useGameStore((s) => s.steakWithdraw);
  const playBet = useGameStore((s) => s.playSteakBet);

  const [game, setGame] = useState<SteakGameId>('coinflip');
  const [amountText, setAmountText] = useState(String(CHIP_QUICK_AMOUNTS[0]));
  const [side, setSide] = useState<CoinSide>('heads');
  const [diceTarget, setDiceTarget] = useState(50);
  const [diceDirection, setDiceDirection] = useState<DiceDirection>('under');
  const [crashTarget, setCrashTarget] = useState(2);
  const [panel, setPanel] = useState<'deposit' | 'withdraw' | null>(null);
  const [panelAmountText, setPanelAmountText] = useState('');
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [outcome, setOutcome] = useState<SteakOutcome | null>(null);

  const reduced = prefersReducedMotion();
  const amount = parseAmount(amountText);
  const panelAmount = parseAmount(panelAmountText);
  const diceChance = diceWinChance(diceTarget, diceDirection);
  const dicePay = diceMultiplier(diceTarget, diceDirection);

  const runBet = (bet: SteakBet) => {
    const result = playBet(bet, amount);
    if (!result.ok) {
      haptic(12);
      setMessage({ tone: 'error', text: result.error ?? '베팅하지 못했습니다.' });
      return;
    }
    setMessage(null);
    setOutcome(result.outcome ?? null);
    haptic(result.outcome?.won ? [8, 30, 8] : 14);
  };

  const runPanel = (kind: 'deposit' | 'withdraw') => {
    const result = kind === 'deposit' ? deposit(panelAmount) : withdraw(panelAmount);
    if (!result.ok) {
      haptic(12);
      setMessage({ tone: 'error', text: result.error ?? '처리하지 못했습니다.' });
      return;
    }
    haptic(8);
    setMessage({
      tone: 'ok',
      text: kind === 'deposit' ? '칩을 충전했습니다.' : '칩을 현금으로 환전했습니다.',
    });
    setPanel(null);
    setPanelAmountText('');
  };

  const openPanel = (kind: 'deposit' | 'withdraw') => {
    setPanel((current) => (current === kind ? null : kind));
    setPanelAmountText('');
    setMessage(null);
  };

  return (
    <div className="flex h-full flex-col bg-[#0E202D] text-[#e8eef2]">
      <header className="relative z-10 shrink-0 pt-[var(--ios-statusbar-h)]">
        <div className="flex h-[var(--ios-navbar-h)] items-center justify-between border-b border-white/5 bg-[#0E202D]/95 px-4">
          <div className="flex items-center gap-2">
            <SteakIcon size={28} />
            <span className="text-[20px] font-extrabold tracking-tight text-white">steak</span>
            <span className="rounded bg-[#00e701]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#00e701]">
              가상
            </span>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-white/40">보유 칩</p>
            <AnimatedNumber
              value={chips}
              format={formatChips}
              className="block text-[15px] font-bold text-[#00e701]"
            />
          </div>
        </div>
      </header>

      <div className="scroll-area no-scrollbar relative flex-1">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING_SNAPPY}
          className="relative mx-4 mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-[#213545] to-[#172B39] p-5 ring-1 ring-white/5"
        >
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] text-white/45">플레이어</p>
              <p className="mt-0.5 truncate text-[16px] font-semibold text-white">{playerName}</p>
            </div>
            <div className="text-right">
              <p className="text-[12px] text-white/45">칩 잔액</p>
              <AnimatedNumber
                value={chips}
                format={formatChips}
                className="mt-0.5 block text-[28px] font-bold leading-none text-[#00e701]"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-label="칩 충전"
              aria-expanded={panel === 'deposit'}
              onClick={() => openPanel('deposit')}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#00e701] text-[14px] font-bold text-[#0E202D] active:scale-[0.98]"
            >
              <ArrowDownToLine className="size-4" aria-hidden /> 충전
            </button>
            <button
              type="button"
              aria-label="현금 환전"
              aria-expanded={panel === 'withdraw'}
              onClick={() => openPanel('withdraw')}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-white/5 text-[14px] font-semibold text-white/80 ring-1 ring-white/10 active:scale-[0.98]"
            >
              <ArrowUpFromLine className="size-4" aria-hidden /> 환전
            </button>
          </div>

          <p className="mt-3 text-[11px] text-white/35">
            현금 {formatCash(cash)} · steak 칩은 게임 안에서만 쓸 수 있습니다.
          </p>

          <AnimatePresence initial={false}>
            {panel ? (
              <motion.div
                key={panel}
                initial={reduced ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={reduced ? undefined : { opacity: 0, height: 0 }}
                transition={SPRING_SNAPPY}
                className="overflow-hidden"
              >
                <div className="mt-3 rounded-2xl bg-[#172B39] p-3 ring-1 ring-white/10">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-white/70">
                      {panel === 'deposit' ? '현금 → 칩' : '칩 → 현금'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setPanel(null)}
                      aria-label="닫기"
                      className="p-1 text-white/40 active:text-white"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </div>
                  <input
                    inputMode="numeric"
                    value={panelAmount ? formatChips(panelAmount) : ''}
                    onChange={(event) => setPanelAmountText(event.target.value)}
                    placeholder="0"
                    aria-label={panel === 'deposit' ? '충전 금액' : '환전 금액'}
                    className="mt-2 h-11 w-full rounded-xl bg-[#0E202D] px-3 text-[18px] font-semibold tabular-nums text-white outline-none ring-1 ring-white/10 placeholder:text-white/25 focus:ring-2 focus:ring-[#00e701]/50"
                  />
                  <div className="mt-2 flex gap-2">
                    {CASH_QUICK.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPanelAmountText(String(value))}
                        className="h-8 flex-1 rounded-full bg-white/5 text-[12px] font-medium text-white/70 active:scale-95"
                      >
                        {formatChips(value)}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => runPanel(panel)}
                    className="mt-2 h-11 w-full rounded-xl bg-[#00e701] text-[14px] font-bold text-[#0E202D] active:scale-[0.98]"
                  >
                    {panel === 'deposit' ? '충전하기' : '환전하기'}
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence initial={false}>
          {message ? (
            <motion.p
              key={message.text}
              role={message.tone === 'error' ? 'alert' : 'status'}
              initial={reduced ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0 }}
              transition={SPRING_SNAPPY}
              className={cn(
                'mx-4 mt-3 rounded-2xl px-3.5 py-2.5 text-[12px] font-medium',
                message.tone === 'error'
                  ? 'bg-[#ff4d4d]/15 text-[#ff8a8a]'
                  : 'bg-[#00e701]/12 text-[#6dff6a]',
              )}
            >
              {message.text}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {outcome ? (
            <motion.div
              key={`${outcome.game}-${outcome.roll}-${outcome.won}`}
              initial={reduced ? false : { opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0 }}
              transition={SPRING_SNAPPY}
              className={cn(
                'relative mx-4 mt-3 overflow-hidden rounded-2xl p-4 ring-1',
                outcome.won
                  ? 'bg-[#00e701]/10 ring-[#00e701]/30'
                  : 'bg-[#ff4d4d]/10 ring-[#ff4d4d]/25',
              )}
            >
              <Burst
                key={`${outcome.game}-${outcome.roll}`}
                show={outcome.won}
                colors={['#00e701', '#7dff6b', '#ffffff', '#0fd18c']}
                radius={90}
              />
              <div className="relative flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-white">{outcome.won ? '승리' : '패배'}</p>
                  <p className="mt-0.5 truncate text-[12px] text-white/50">{outcome.detail}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={cn(
                      'text-[20px] font-bold tabular-nums',
                      outcome.won ? 'text-[#00e701]' : 'text-white/35',
                    )}
                  >
                    {outcome.payout - outcome.stake >= 0 ? '+' : '-'}
                    {formatChips(Math.abs(outcome.payout - outcome.stake))}
                  </p>
                  <p className="text-[11px] text-white/35">x{outcome.multiplier.toFixed(2)}</p>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="mx-4 mt-4 flex rounded-2xl bg-[#172B39] p-1 ring-1 ring-white/5">
          {GAME_TABS.map(({ id, label, Icon }) => {
            const active = game === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => setGame(id)}
                className={cn(
                  'relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-semibold transition-colors',
                  active ? 'text-[#00e701]' : 'text-white/45',
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="steak-game-tab"
                    transition={SPRING_SNAPPY}
                    className="absolute inset-0 rounded-xl bg-[#213545]"
                  />
                ) : null}
                <span className="relative flex items-center gap-1.5">
                  <Icon className="size-4" aria-hidden />
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mx-4 mt-3 rounded-3xl bg-[#172B39] p-4 ring-1 ring-white/5">
          <label className="block">
            <span className="mb-1.5 flex items-center justify-between text-[12px] text-white/45">
              <span>베팅 금액</span>
              <span>보유 {formatChips(chips)}</span>
            </span>
            <input
              inputMode="numeric"
              value={amount ? formatChips(amount) : ''}
              onChange={(event) => setAmountText(event.target.value)}
              placeholder="0"
              aria-label="베팅 금액"
              className="h-12 w-full rounded-xl bg-[#0E202D] px-3 text-[20px] font-semibold tabular-nums text-white outline-none ring-1 ring-white/10 placeholder:text-white/25 focus:ring-2 focus:ring-[#00e701]/50"
            />
          </label>
          <div className="mt-2 flex gap-2">
            {BET_QUICK.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmountText(String(value))}
                className="h-8 flex-1 rounded-full bg-white/5 text-[12px] font-medium text-white/70 active:scale-95"
              >
                {formatChips(value)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmountText(String(Math.max(0, Math.floor(chips))))}
              className="h-8 flex-1 rounded-full bg-white/5 text-[12px] font-medium text-white/70 active:scale-95"
            >
              최대
            </button>
          </div>

          <div className="mt-4">
            {game === 'coinflip' ? (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[12px] text-white/45">
                  <Coins className="size-3.5 text-[#00e701]" aria-hidden />
                  면을 선택하면 바로 베팅됩니다.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(['heads', 'tails'] as const).map((value) => {
                    const selected = side === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-label={`${value === 'heads' ? '앞면' : '뒷면'}에 베팅`}
                        aria-pressed={selected}
                        onClick={() => {
                          setSide(value);
                          runBet({ game: 'coinflip', side: value });
                        }}
                        className={cn(
                          'flex h-20 flex-col items-center justify-center gap-1 rounded-2xl text-[15px] font-bold transition-transform active:scale-[0.97]',
                          selected
                            ? 'bg-[#00e701] text-[#0E202D]'
                            : 'bg-white/5 text-white/70 ring-1 ring-white/10',
                        )}
                      >
                        <span>{value === 'heads' ? '앞면' : '뒷면'}</span>
                        <span
                          className={cn(
                            'text-[11px] font-semibold',
                            selected ? 'text-[#0E202D]/60' : 'text-white/35',
                          )}
                        >
                          x{COINFLIP_MULTIPLIER.toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {game === 'dice' ? (
              <div>
                <div className="flex rounded-xl bg-[#0E202D] p-1">
                  {(['under', 'over'] as const).map((direction) => (
                    <button
                      key={direction}
                      type="button"
                      aria-pressed={diceDirection === direction}
                      onClick={() => setDiceDirection(direction)}
                      className={cn(
                        'flex-1 rounded-lg py-1.5 text-[12px] font-semibold transition-colors',
                        diceDirection === direction
                          ? 'bg-[#00e701] text-[#0E202D]'
                          : 'text-white/50',
                      )}
                    >
                      {direction === 'under' ? '언더' : '오버'}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min={2}
                  max={98}
                  value={diceTarget}
                  onChange={(event) => setDiceTarget(clampDiceTarget(Number(event.target.value)))}
                  aria-label="주사위 기준"
                  className="mt-4 w-full accent-[#00e701]"
                />
                <div className="mt-1 flex items-center justify-between gap-2 text-[12px]">
                  <span className="text-white/45">
                    기준 <span className="font-semibold text-white">{diceTarget}</span>{' '}
                    {diceDirection === 'under' ? '미만' : '초과'}
                  </span>
                  <span className="text-white/45">
                    승률 <span className="font-semibold text-[#00e701]">{diceChance}%</span> · x
                    {dicePay.toFixed(2)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    runBet({ game: 'dice', target: diceTarget, direction: diceDirection })
                  }
                  className="mt-4 h-12 w-full rounded-2xl bg-[#00e701] text-[15px] font-bold text-[#0E202D] active:scale-[0.98]"
                >
                  주사위 굴리기
                </button>
              </div>
            ) : null}

            {game === 'crash' ? (
              <div>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-1.5 text-[12px] text-white/45">
                      <Rocket className="size-3.5 text-[#00e701]" aria-hidden />
                      목표 배당
                    </p>
                    <AnimatedNumber
                      value={crashTarget}
                      format={(value) => `${value.toFixed(2)}x`}
                      className="mt-0.5 block text-[26px] font-bold text-[#00e701]"
                    />
                  </div>
                  <p className="pb-1 text-right text-[11px] text-white/35">
                    이 배당에 도달하면 승리
                  </p>
                </div>
                <input
                  type="range"
                  min={1.1}
                  max={10}
                  step={0.1}
                  value={crashTarget}
                  onChange={(event) => setCrashTarget(clampCrashTarget(Number(event.target.value)))}
                  aria-label="크래시 목표 배당"
                  className="mt-3 w-full accent-[#00e701]"
                />
                <div className="mt-2 flex gap-2">
                  {CRASH_PRESETS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCrashTarget(value)}
                      className={cn(
                        'h-8 flex-1 rounded-full text-[12px] font-semibold transition-colors',
                        crashTarget === value
                          ? 'bg-[#00e701] text-[#0E202D]'
                          : 'bg-white/5 text-white/60',
                      )}
                    >
                      {value.toFixed(1)}x
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => runBet({ game: 'crash', target: crashTarget })}
                  className="mt-4 h-12 w-full rounded-2xl bg-[#00e701] text-[15px] font-bold text-[#0E202D] active:scale-[0.98]"
                >
                  크래시 시작
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mx-4 mb-10 mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[12px] font-semibold uppercase tracking-wide text-white/40">
              최근 베팅
            </h2>
            <span className="text-[11px] text-white/30">{bets.length}건</span>
          </div>
          <div className="overflow-hidden rounded-2xl bg-[#172B39] ring-1 ring-white/5">
            {bets.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-white/35">
                아직 베팅 기록이 없습니다.
              </p>
            ) : (
              <ul>
                <AnimatePresence initial={false}>
                  {bets.slice(0, 10).map((bet, index) => {
                    const net = bet.payout - bet.amount;
                    return (
                      <motion.li
                        key={bet.id}
                        layout
                        initial={reduced ? false : { opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ ...SPRING_SNAPPY, delay: Math.min(index, 6) * 0.04 }}
                        className="flex items-center gap-3 border-b border-white/5 px-4 py-3 last:border-b-0"
                      >
                        <motion.div
                          animate={bet.won ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                          transition={bet.won ? { duration: 0.5, delay: 0.05 } : SPRING_SNAPPY}
                          className={cn(
                            'flex size-9 shrink-0 items-center justify-center rounded-xl',
                            bet.won ? 'bg-[#00e701]/15' : 'bg-white/5',
                          )}
                        >
                          {bet.game === 'coinflip' ? (
                            <Coins className="size-4 text-[#00e701]" aria-hidden />
                          ) : bet.game === 'dice' ? (
                            <Dices className="size-4 text-[#00e701]" aria-hidden />
                          ) : (
                            <Rocket className="size-4 text-[#00e701]" aria-hidden />
                          )}
                        </motion.div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-medium text-white/85">
                            {GAME_LABEL[bet.game]} · {bet.detail}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/35">
                            <span
                              className={cn(
                                'rounded px-1 py-0.5 text-[10px] font-bold',
                                bet.won
                                  ? 'bg-[#00e701]/15 text-[#6dff6a]'
                                  : 'bg-[#ff4d4d]/15 text-[#ff8a8a]',
                              )}
                            >
                              {bet.won ? '승' : '패'}
                            </span>
                            {formatShortDate(bet.at)} · x{bet.multiplier.toFixed(2)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'shrink-0 text-[14px] font-semibold tabular-nums',
                            bet.won ? 'text-[#00e701]' : 'text-white/35',
                          )}
                        >
                          {net >= 0 ? '+' : '-'}
                          {formatChips(Math.abs(net))}
                        </span>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </div>

        <p className="px-6 pb-10 text-center text-[11px] leading-relaxed text-white/30">
          steak는 허구의 카지노 앱입니다. 실제 돈이나 암호화폐를 쓰지 않으며, 모든 칩은 게임
          안에서만 의미가 있습니다.
        </p>
      </div>
    </div>
  );
}
