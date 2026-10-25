import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRightLeft, CalendarClock, Check, Reply, ShieldAlert } from 'lucide-react';
import { npcs } from '@/data';
import { findScript } from '@/content/messages';
import { channelLabel, type Channel } from '@/game';
import { Pill } from '@/components';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/utils/cn';
import { formatShortDate } from '@/utils/format';
import { SPRING_BOUNCY, fadeUp, staggerContainer } from '@/utils/motion';

interface Bubble {
  id: string;
  side: 'left' | 'right' | 'system';
  text: string;
  at: string;
  tone?: 'moved' | 'booked';
}

/**
 * One conversation, opened like a real messenger thread: header, bubbles and a
 * reply bar. The reply bar shows the available answers until one is sent.
 */
export function MessengerChat({
  channel,
  messageId,
  onClose,
}: {
  channel: Channel;
  messageId: string;
  onClose: () => void;
}) {
  const inbox = useGameStore((s) => s.inbox);
  const deals = useGameStore((s) => s.deals);
  const trust = useGameStore((s) => s.trust);
  const answerInbox = useGameStore((s) => s.answerInbox);

  const message = inbox.find((entry) => entry.id === messageId);
  const script = message ? findScript(message.scriptId) : undefined;
  const npc = message ? npcs.find((entry) => entry.id === message.npcId) : undefined;

  const bubbles = useMemo<Bubble[]>(() => {
    if (!message || !script) return [];
    const list: Bubble[] = [
      { id: 'opener', side: 'left', text: script.opener, at: message.arrivedAt },
    ];
    if (message.status === 'answered') {
      list.push({ id: 'reply', side: 'right', text: message.reply ?? '', at: message.arrivedAt });
      list.push({ id: 'outcome', side: 'system', text: message.outcome ?? '', at: message.arrivedAt });
      if (message.moved) {
        list.push({
          id: 'moved',
          side: 'system',
          text: `${channelLabel(message.channel)} 쪽으로 대화를 옮겼습니다.`,
          at: message.arrivedAt,
          tone: 'moved',
        });
      }
    }
    return list;
  }, [message, script]);

  const booked = deals.some((deal) => deal.source.messageId === messageId);

  if (!message || !script) {
    return (
      <div className="absolute inset-0 z-30 flex flex-col bg-ios-bg pt-[var(--ios-statusbar-h)]">
        <header className="flex h-[var(--ios-navbar-h)] items-center gap-2 px-2">
          <BackButton onClose={onClose} />
          <span className="text-[16px] font-semibold">대화를 찾을 수 없습니다</span>
        </header>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-ios-bg pt-[var(--ios-statusbar-h)]">
      {/* header */}
      <header className="glass-strong flex h-[var(--ios-navbar-h)] shrink-0 items-center gap-2 border-b border-ios-separator/20 px-1.5">
        <BackButton onClose={onClose} />
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ios-accent/15 text-[13px] font-bold text-ios-accent">
          {(npc?.name ?? '?').slice(0, 1)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold">{npc?.name ?? '알 수 없음'}</span>
          <span className="block truncate text-[11px] text-ios-muted">{npc?.bio ?? ''}</span>
        </span>
        <Pill tone={channel === 'telegraph' ? 'purple' : 'green'}>{channelLabel(channel)}</Pill>
      </header>

      {/* bubbles */}
      <div className="scroll-area no-scrollbar flex-1 px-3 py-4">
        <div className="mb-3 flex items-center justify-center gap-2">
          <Pill tone="neutral">신뢰 {trust}</Pill>
          {npc?.kind === 'undercover' ? (
            <Pill tone="orange" icon={<ShieldAlert className="size-3" />}>
              수상함
            </Pill>
          ) : null}
        </div>

        <motion.div
          variants={staggerContainer(0.06)}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          {bubbles.map((bubble) => (
            <motion.div
              key={bubble.id}
              variants={fadeUp}
              className={cn(
                'flex',
                bubble.side === 'right' && 'justify-end',
                bubble.side === 'system' && 'justify-center',
              )}
            >
              {bubble.side === 'system' ? (
                <p
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3 py-2 text-center text-[11px] leading-relaxed',
                    bubble.tone === 'moved' && 'bg-ios-orange/15 text-ios-orange',
                    bubble.tone === 'booked' && 'bg-ios-green/15 text-ios-green',
                    !bubble.tone && 'bg-ios-separator/15 text-ios-muted',
                  )}
                >
                  {bubble.text}
                </p>
              ) : (
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-3 py-2 text-[14px] leading-relaxed shadow-sm',
                    bubble.side === 'left'
                      ? 'rounded-bl-md bg-ios-surface text-ios-text ring-1 ring-black/5 dark:ring-white/5'
                      : 'rounded-br-md bg-ios-accent text-white',
                  )}
                >
                  <p>{bubble.text}</p>
                  <p
                    className={cn(
                      'mt-1 text-right text-[10px]',
                      bubble.side === 'left' ? 'text-ios-muted' : 'text-white/70',
                    )}
                  >
                    {formatShortDate(bubble.at)}
                  </p>
                </div>
              )}
            </motion.div>
          ))}

          {booked ? (
            <motion.div key="booked" variants={fadeUp} className="flex justify-center">
              <p className="flex max-w-[85%] items-center gap-1.5 rounded-2xl bg-ios-green/15 px-3 py-2 text-center text-[11px] leading-relaxed text-ios-green">
                <CalendarClock className="size-3.5 shrink-0" aria-hidden />
                약속이 잡혔습니다. 거래 앱의 "약속"에서 물량을 넘기세요.
              </p>
            </motion.div>
          ) : null}
        </motion.div>
      </div>

      {/* reply bar */}
      <div className="glass-strong shrink-0 border-t border-ios-separator/20 px-3 pb-[max(env(safe-area-inset-bottom),10px)] pt-2.5">
        {message.status === 'answered' ? (
          <p className="flex items-center justify-center gap-1.5 py-2 text-[12px] text-ios-muted">
            <Check className="size-3.5 text-ios-green" aria-hidden />
            답장을 보냈습니다.
          </p>
        ) : (
          <motion.div
            variants={staggerContainer(0.05)}
            initial="hidden"
            animate="show"
            className="space-y-1.5"
          >
            {script.choices.map((choice) => (
              <motion.button
                key={choice.id}
                type="button"
                variants={fadeUp}
                whileTap={{ scale: 0.98 }}
                transition={SPRING_BOUNCY}
                onClick={() => answerInbox(message.id, choice.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-full px-3.5 py-2.5 text-left text-[13px] font-medium shadow-sm ring-1',
                  choice.moveTo
                    ? 'bg-ios-surface text-ios-text ring-ios-orange/30'
                    : 'bg-ios-surface text-ios-text ring-black/5 dark:ring-white/10',
                )}
              >
                {choice.moveTo ? (
                  <ArrowRightLeft className="size-3.5 shrink-0 text-ios-orange" aria-hidden />
                ) : (
                  <Reply className="size-3.5 shrink-0 text-ios-accent" aria-hidden />
                )}
                <span className="min-w-0 flex-1">{choice.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function BackButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="대화 목록으로"
      className="flex h-10 items-center gap-0.5 pr-2 text-ios-accent"
    >
      <ArrowLeft className="size-5" aria-hidden />
    </button>
  );
}
