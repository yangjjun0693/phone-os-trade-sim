import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, MessageCircle } from 'lucide-react';
import { npcs } from '@/data';
import { channelHint, channelLabel, unreadCount, type Channel, type InboxMessage } from '@/game';
import { Pill } from '@/components';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/utils/cn';
import { formatShortDate } from '@/utils/format';
import { fadeUp, staggerContainer } from '@/utils/motion';

export interface Thread {
  npcId: string;
  /** Every message from this person on this channel, oldest first. */
  messages: InboxMessage[];
  last: InboxMessage;
  unread: number;
  /** The message that is still waiting for an answer, if any. */
  pending?: InboxMessage;
}

/** Groups messages into one conversation per person. */
export function useThreads(channel: Channel): Thread[] {
  const inbox = useGameStore((s) => s.inbox);
  return useMemo(() => {
    const byNpc = new Map<string, InboxMessage[]>();
    for (const message of inbox) {
      if (message.channel !== channel) continue;
      const list = byNpc.get(message.npcId) ?? [];
      list.push(message);
      byNpc.set(message.npcId, list);
    }
    return [...byNpc.entries()]
      .map(([npcId, list]) => {
        const messages = [...list].sort(
          (a, b) => new Date(a.arrivedAt).getTime() - new Date(b.arrivedAt).getTime(),
        );
        return {
          npcId,
          messages,
          last: messages[messages.length - 1],
          unread: messages.filter((message) => message.status === 'unread').length,
          pending: messages.find((message) => message.status !== 'answered'),
        };
      })
      .sort((a, b) => new Date(b.last.arrivedAt).getTime() - new Date(a.last.arrivedAt).getTime());
  }, [inbox, channel]);
}

/**
 * The thread list for one channel. One row per person: tapping it opens the
 * whole conversation, so a repeat customer continues where you left off.
 */
export function MessengerInbox({
  channel,
  onOpenThread,
}: {
  channel: Channel;
  onOpenThread: (npcId: string) => void;
}) {
  const inbox = useGameStore((s) => s.inbox);
  const trust = useGameStore((s) => s.trust);
  const openInbox = useGameStore((s) => s.openInbox);
  const threads = useThreads(channel);
  const unread = unreadCount(inbox, channel);

  return (
    <div className="pb-1">
      <div className="flex items-center justify-between px-4 pb-1.5 pt-3">
        <div className="flex items-center gap-1.5">
          <MessageCircle className="size-3.5 text-ios-accent" aria-hidden />
          <h3 className="text-[13px] font-semibold">거래 메시지</h3>
          <Pill tone={channel === 'telegraph' ? 'purple' : 'green'}>
            {channelLabel(channel)}
          </Pill>
          {unread > 0 ? <Pill tone="red">{unread}</Pill> : null}
        </div>
        <Pill tone="neutral">신뢰 {trust}</Pill>
      </div>
      <p className="px-4 pb-2 text-[11px] text-ios-muted">{channelHint(channel)}</p>

      {threads.length === 0 ? (
        <p className="mx-4 mb-2 rounded-xl bg-ios-surface px-3 py-4 text-center text-[12px] text-ios-muted ring-1 ring-black/5 dark:ring-white/5">
          이 채널로 온 메시지가 없습니다. 상대는 다른 앱으로 연락할 수도 있습니다.
        </p>
      ) : (
        <motion.ul
          variants={staggerContainer(0.04)}
          initial="hidden"
          animate="show"
          className="mx-2 space-y-1"
        >
          {threads.map((thread) => {
            const npc = npcs.find((entry) => entry.id === thread.npcId);
            const answered = !thread.pending;
            return (
              <motion.li key={thread.npcId} variants={fadeUp}>
                <button
                  type="button"
                  onClick={() => {
                    if (thread.pending) openInbox(thread.pending.id);
                    onOpenThread(thread.npcId);
                  }}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left',
                    thread.unread > 0 ? 'bg-ios-accent/10' : 'bg-ios-surface/60',
                  )}
                >
                  <span className="relative mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-ios-accent/15 text-[14px] font-bold text-ios-accent">
                    {(npc?.name ?? '?').slice(0, 1)}
                    {thread.unread > 0 ? (
                      <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-ios-red text-[9px] font-bold text-white ring-2 ring-ios-bg">
                        {thread.unread}
                      </span>
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[14px] font-semibold">
                        {npc?.name ?? '알 수 없음'}
                      </span>
                      {npc?.vendor ? (
                        <Pill tone="yellow" className="shrink-0 text-[10px]">
                          공급
                        </Pill>
                      ) : null}
                      {answered ? (
                        <Check className="size-3.5 shrink-0 text-ios-green" aria-hidden />
                      ) : null}
                      <span className="ml-auto shrink-0 text-[11px] text-ios-muted">
                        {formatShortDate(thread.last.arrivedAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-ios-muted">
                      {thread.pending
                        ? (thread.pending.reply || '답장을 기다리는 중')
                        : `나: ${thread.last.reply ?? ''}`}
                    </span>
                  </span>
                </button>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </div>
  );
}
