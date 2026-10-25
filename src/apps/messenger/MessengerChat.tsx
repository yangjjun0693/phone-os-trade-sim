import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRightLeft, CalendarClock, Package, Reply, ShieldAlert } from 'lucide-react';
import { npcs, products } from '@/data';
import { findScript } from '@/content/messages';
import { channelLabel, type Channel } from '@/game';
import { Pill } from '@/components';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/utils/cn';
import { formatShortDate } from '@/utils/format';
import { SPRING_BOUNCY, fadeUp, staggerContainer } from '@/utils/motion';
import { useThreads } from './MessengerInbox';

interface Bubble {
  id: string;
  side: 'left' | 'right' | 'system';
  text: string;
  at: string;
  tone?: 'moved' | 'booked' | 'order';
}

/**
 * One person's conversation on one channel — the whole history, so a repeat
 * contact simply continues the same thread instead of starting a new one.
 */
export function MessengerChat({
  channel,
  npcId,
  onClose,
}: {
  channel: Channel;
  npcId: string;
  onClose: () => void;
}) {
  const threads = useThreads(channel);
  const deals = useGameStore((s) => s.deals);
  const trust = useGameStore((s) => s.trust);
  const answerInbox = useGameStore((s) => s.answerInbox);

  const thread = threads.find((entry) => entry.npcId === npcId);
  const npc = npcs.find((entry) => entry.id === npcId);

  const bubbles = useMemo<Bubble[]>(() => {
    if (!thread) return [];
    const list: Bubble[] = [];
    for (const message of thread.messages) {
      const script = findScript(message.scriptId);
      list.push({
        id: `${message.id}-open`,
        side: 'left',
        text: script?.opener ?? '대화 내용을 찾을 수 없습니다.',
        at: message.arrivedAt,
      });
      if (message.status === 'answered') {
        list.push({
          id: `${message.id}-reply`,
          side: 'right',
          text: message.reply ?? '',
          at: message.arrivedAt,
        });
        list.push({
          id: `${message.id}-outcome`,
          side: 'system',
          text: message.outcome ?? '',
          at: message.arrivedAt,
        });
        if (message.moved) {
          list.push({
            id: `${message.id}-moved`,
            side: 'system',
            text: `${channelLabel(message.channel)} 쪽으로 대화를 옮겼습니다.`,
            at: message.arrivedAt,
            tone: 'moved',
          });
        }
        const booked = deals.some((deal) => deal.source.messageId === message.id);
        if (booked) {
          list.push({
            id: `${message.id}-booked`,
            side: 'system',
            text: '약속이 잡혔습니다. 거래 앱의 "약속"에서 물량을 넘기세요.',
            at: message.arrivedAt,
            tone: 'booked',
          });
        }
        if (message.choiceId?.startsWith('order-') || message.choiceId?.startsWith('haggle-')) {
          list.push({
            id: `${message.id}-order`,
            side: 'system',
            text: '주문이 들어갔습니다. 구팡의 "내 주문"에서 확인하세요.',
            at: message.arrivedAt,
            tone: 'order',
          });
        }
      }
    }
    return list;
  }, [thread, deals]);

  const pending = thread?.pending;

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-ios-bg pt-[var(--ios-statusbar-h)]">
      <header className="glass-strong flex h-[var(--ios-navbar-h)] shrink-0 items-center gap-2 border-b border-ios-separator/20 px-1.5">
        <button
          type="button"
          onClick={onClose}
          aria-label="대화 목록으로"
          className="flex h-10 items-center gap-0.5 pr-2 text-ios-accent"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ios-accent/15 text-[13px] font-bold text-ios-accent">
          {(npc?.name ?? '?').slice(0, 1)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold">
            {npc?.name ?? '알 수 없음'}
          </span>
          <span className="block truncate text-[11px] text-ios-muted">{npc?.bio ?? ''}</span>
        </span>
        {npc?.vendor ? <Pill tone="yellow">공급</Pill> : null}
        <Pill tone={channel === 'telegraph' ? 'purple' : 'green'}>{channelLabel(channel)}</Pill>
      </header>

      <div className="scroll-area no-scrollbar flex-1 px-3 py-4">
        <div className="mb-3 flex items-center justify-center gap-2">
          <Pill tone="neutral">신뢰 {trust}</Pill>
          <Pill tone="neutral">대화 {thread?.messages.length ?? 0}회</Pill>
          {npc?.kind === 'undercover' ? (
            <Pill tone="orange" icon={<ShieldAlert className="size-3" />}>
              수상함
            </Pill>
          ) : null}
        </div>

        <motion.div
          variants={staggerContainer(0.05)}
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
                    bubble.tone === 'order' && 'bg-ios-yellow/20 text-ios-yellow',
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
        </motion.div>
      </div>

      {/* reply bar */}
      <div className="glass-strong shrink-0 border-t border-ios-separator/20 px-3 pb-[max(env(safe-area-inset-bottom),10px)] pt-2.5">
        {!pending ? (
          <p className="flex items-center justify-center gap-1.5 py-2 text-[12px] text-ios-muted">
            지금은 답장할 메시지가 없습니다. 다음 연락을 기다리세요.
          </p>
        ) : (
          <motion.div
            variants={staggerContainer(0.05)}
            initial="hidden"
            animate="show"
            className="space-y-1.5"
          >
            {findScript(pending.scriptId)?.choices.map((choice) => (
              <motion.button
                key={choice.id}
                type="button"
                variants={fadeUp}
                whileTap={{ scale: 0.98 }}
                transition={SPRING_BOUNCY}
                onClick={() => answerInbox(pending.id, choice.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-full px-3.5 py-2.5 text-left text-[13px] font-medium shadow-sm ring-1',
                  choice.order
                    ? 'bg-ios-surface text-ios-text ring-ios-yellow/40'
                    : choice.moveTo
                      ? 'bg-ios-surface text-ios-text ring-ios-orange/30'
                      : choice.booking
                        ? 'bg-ios-surface text-ios-text ring-ios-green/30'
                        : 'bg-ios-surface text-ios-text ring-black/5 dark:ring-white/10',
                )}
              >
                {choice.order ? (
                  <Package className="size-3.5 shrink-0 text-ios-yellow" aria-hidden />
                ) : choice.moveTo ? (
                  <ArrowRightLeft className="size-3.5 shrink-0 text-ios-orange" aria-hidden />
                ) : choice.booking ? (
                  <CalendarClock className="size-3.5 shrink-0 text-ios-green" aria-hidden />
                ) : (
                  <Reply className="size-3.5 shrink-0 text-ios-accent" aria-hidden />
                )}
                <span className="min-w-0 flex-1">{choice.label}</span>
              </motion.button>
            ))}
            <p className="pt-1 text-center text-[10px] text-ios-muted">
              {products.length > 0 ? '선택하면 바로 전송됩니다.' : ''}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
