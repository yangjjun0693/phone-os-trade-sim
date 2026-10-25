/**
 * Messenger rules, kept pure so the two channels can be tested without React.
 *
 * Two messengers exist and they are NOT interchangeable:
 *  - `telegraph` = 익명 앱 (느리게 도착, 흔적이 적다)
 *  - `phone`     = 실명 문자 (즉시 도착, 흔적이 크다)
 *
 * Customers reach out over time on one of the two, and the player decides
 * whether to answer there or move the conversation to the other channel.
 */
import { nanoid } from 'nanoid';
import { MESSAGE_SCRIPTS, findScript, type Channel, type MessageChoice, type MessageScript } from '@/content/messages';
import type { Rng } from './customers';
import { clamp } from './pricing';

export type { Channel, MessageChoice, MessageScript };

export interface InboxMessage {
  id: string;
  scriptId: string;
  /** npcs.json id of whoever wrote in. */
  npcId: string;
  /** Which messenger the thread currently lives in. */
  channel: Channel;
  /** Game-time ISO string. */
  arrivedAt: string;
  status: 'unread' | 'open' | 'answered';
  /** Chosen option, once answered. */
  choiceId?: string;
  reply?: string;
  outcome?: string;
  /** True when answering moved the thread to the other channel. */
  moved?: boolean;
}

/** Pending (unanswered) messages the inbox will hold before it stops filling. */
export const INBOX_LIMIT = 8;
/** Minimum game minutes between arrivals. */
export const MIN_GAP_MINUTES = 25;
/** How long the conversation stays interesting before it goes cold. */
export const MESSAGE_TTL_MINUTES = 60 * 26;

export function channelLabel(channel: Channel): string {
  return channel === 'telegraph' ? '익명 앱' : '문자';
}

export function channelHint(channel: Channel): string {
  return channel === 'telegraph'
    ? '익명 · 흔적이 적고 답장이 늦다'
    : '실명 · 즉시 도착하지만 기록이 남는다';
}

function pickChannel(script: MessageScript, rng: Rng): Channel {
  if (script.channel !== 'either') return script.channel;
  return rng() < 0.5 ? 'telegraph' : 'phone';
}

/**
 * Rolls for one new arrival. Returns `null` when nothing should show up.
 * Messages never repeat while an earlier one from the same script is pending,
 * so the inbox always reads like a conversation rather than duplicates.
 */
export function rollArrival(input: {
  now: string;
  lastAt: string | null;
  heat: number;
  inbox: readonly InboxMessage[];
  rng?: Rng;
}): InboxMessage | null {
  const rng = input.rng ?? Math.random;
  const pending = input.inbox.filter((message) => message.status !== 'answered');
  if (pending.length >= INBOX_LIMIT) return null;

  const now = new Date(input.now).getTime();
  const last = input.lastAt ? new Date(input.lastAt).getTime() : now - 60 * 60 * 1000;
  const gapMinutes = (now - last) / 60_000;
  if (gapMinutes < MIN_GAP_MINUTES) return null;

  // Hotter days bring more attention.
  const chance = clamp(0.3 + input.heat / 250, 0.25, 0.7);
  if (rng() > chance) return null;

  const used = new Set(pending.map((message) => message.scriptId));
  const pool = MESSAGE_SCRIPTS.filter((script) => !used.has(script.id));
  if (pool.length === 0) return null;

  const script = pool[Math.floor(rng() * pool.length) % pool.length];
  return {
    id: `msg-${nanoid(6)}`,
    scriptId: script.id,
    npcId: script.from,
    channel: pickChannel(script, rng),
    arrivedAt: input.now,
    status: 'unread',
  };
}

export interface AnswerEffects {
  heat: number;
  trust: number;
  cash: number;
}

export interface AnswerResult {
  ok: boolean;
  error?: string;
  effects: AnswerEffects;
  reply: string;
  outcome: string;
  /** Channel the thread ends up in after answering. */
  channel: Channel;
  moved: boolean;
}

/** Applies one choice to one message. The script data owns all the numbers. */
export function resolveAnswer(
  message: InboxMessage,
  choiceId: string,
): AnswerResult {
  const script = findScript(message.scriptId);
  if (!script) {
    return {
      ok: false,
      error: '대화 내용을 찾을 수 없습니다.',
      effects: { heat: 0, trust: 0, cash: 0 },
      reply: '',
      outcome: '',
      channel: message.channel,
      moved: false,
    };
  }
  const choice = script.choices.find((entry) => entry.id === choiceId);
  if (!choice) {
    return {
      ok: false,
      error: '선택할 수 없는 답장입니다.',
      effects: { heat: 0, trust: 0, cash: 0 },
      reply: '',
      outcome: '',
      channel: message.channel,
      moved: false,
    };
  }

  const moved = Boolean(choice.moveTo && choice.moveTo !== message.channel);
  return {
    ok: true,
    effects: {
      heat: choice.effect?.heat ?? 0,
      trust: choice.effect?.trust ?? 0,
      cash: choice.effect?.cash ?? 0,
    },
    reply: choice.reply,
    outcome: choice.outcome,
    channel: choice.moveTo ?? message.channel,
    moved,
  };
}

/** Messages that are still worth answering. */
export function isPending(message: InboxMessage): boolean {
  return message.status !== 'answered';
}

/** Drops conversations the player ignored for too long. */
export function expireInbox(inbox: InboxMessage[], now: string): InboxMessage[] {
  const nowMs = new Date(now).getTime();
  return inbox.filter((message) => {
    if (!isPending(message)) return true;
    const ageMinutes = (nowMs - new Date(message.arrivedAt).getTime()) / 60_000;
    return ageMinutes < MESSAGE_TTL_MINUTES;
  });
}

export function unreadCount(inbox: readonly InboxMessage[], channel?: Channel): number {
  return inbox.filter(
    (message) =>
      message.status === 'unread' && (channel === undefined || message.channel === channel),
  ).length;
}
