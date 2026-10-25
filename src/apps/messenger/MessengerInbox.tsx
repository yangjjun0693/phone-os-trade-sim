import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRightLeft, Check, MessageCircle, Reply } from 'lucide-react';
import { npcs } from '@/data';
import { findScript } from '@/content/messages';
import { channelHint, channelLabel, unreadCount, type Channel } from '@/game';
import { Pill } from '@/components';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/utils/cn';
import { formatShortDate } from '@/utils/format';
import { SPRING_BOUNCY, SPRING_SNAPPY, fadeUp, staggerContainer } from '@/utils/motion';

const npcById = (id: string) => npcs.find((npc) => npc.id === id);

/**
 * The shared inbox for one channel. Both messengers render this with a
 * different `channel`, so the same thread can be answered from either app.
 */
export function MessengerInbox({ channel }: { channel: Channel }) {
  const inbox = useGameStore((s) => s.inbox);
  const trust = useGameStore((s) => s.trust);
  const openInbox = useGameStore((s) => s.openInbox);
  const answerInbox = useGameStore((s) => s.answerInbox);
  const [openId, setOpenId] = useState<string | null>(null);

  const threads = useMemo(
    () =>
      inbox
        .filter((message) => message.channel === channel)
        .sort((a, b) => new Date(b.arrivedAt).getTime() - new Date(a.arrivedAt).getTime()),
    [inbox, channel],
  );
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
          {threads.map((message) => {
            const npc = npcById(message.npcId);
            const script = findScript(message.scriptId);
            const answered = message.status === 'answered';
            const open = openId === message.id;

            return (
              <motion.li key={message.id} variants={fadeUp}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(open ? null : message.id);
                    if (!open) openInbox(message.id);
                  }}
                  className={cn(
                    'w-full rounded-xl px-3 py-2.5 text-left',
                    message.status === 'unread' ? 'bg-ios-accent/10' : 'bg-ios-surface/60',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold">{npc?.name ?? '알 수 없음'}</span>
                    {message.status === 'unread' ? (
                      <span className="size-2 rounded-full bg-ios-accent" aria-hidden />
                    ) : null}
                    {answered ? (
                      <Check className="size-3.5 text-ios-green" aria-hidden />
                    ) : null}
                    <span className="ml-auto text-[11px] text-ios-muted">
                      {formatShortDate(message.arrivedAt)}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-ios-muted">
                    {answered ? `나: ${message.reply ?? ''}` : (script?.opener ?? '')}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      key="body"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={SPRING_SNAPPY}
                      className="overflow-hidden"
                    >
                      <div className="px-1 pb-2 pt-2">
                        <p className="flex items-start gap-2 rounded-2xl bg-ios-separator/15 px-3 py-2 text-[13px] leading-relaxed">
                          <MessageCircle className="mt-0.5 size-3.5 shrink-0 text-ios-muted" aria-hidden />
                          {script?.opener ?? '대화 내용을 찾을 수 없습니다.'}
                        </p>

                        {answered ? (
                          <div className="mt-2 space-y-2">
                            <p className="flex items-start gap-2 rounded-2xl bg-ios-accent/15 px-3 py-2 text-[13px] leading-relaxed">
                              <Reply className="mt-0.5 size-3.5 shrink-0 text-ios-accent" aria-hidden />
                              {message.reply}
                            </p>
                            <p className="rounded-xl bg-ios-surface px-3 py-2 text-[12px] leading-relaxed text-ios-muted ring-1 ring-black/5 dark:ring-white/5">
                              {message.outcome}
                            </p>
                            {message.moved ? (
                              <p className="flex items-center gap-1.5 text-[11px] text-ios-orange">
                                <ArrowRightLeft className="size-3" aria-hidden />
                                대화가 {channelLabel(message.channel)} 쪽으로 옮겨졌습니다.
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <motion.div
                            variants={staggerContainer(0.05)}
                            initial="hidden"
                            animate="show"
                            className="mt-2 space-y-1.5"
                          >
                            {script?.choices.map((choice) => (
                              <motion.button
                                key={choice.id}
                                type="button"
                                variants={fadeUp}
                                whileTap={{ scale: 0.98 }}
                                transition={SPRING_BOUNCY}
                                onClick={() => answerInbox(message.id, choice.id)}
                                className="flex w-full items-center gap-2 rounded-xl bg-ios-surface px-3 py-2.5 text-left text-[13px] ring-1 ring-black/5 dark:ring-white/5"
                              >
                                {choice.moveTo ? (
                                  <ArrowRightLeft className="size-3.5 shrink-0 text-ios-orange" aria-hidden />
                                ) : (
                                  <Reply className="size-3.5 shrink-0 text-ios-accent" aria-hidden />
                                )}
                                <span className="min-w-0 flex-1">{choice.label}</span>
                                <span className="shrink-0 text-ios-separator" aria-hidden>
                                  ›
                                </span>
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </div>
  );
}
