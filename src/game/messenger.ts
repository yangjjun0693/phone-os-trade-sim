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
import {
  MESSAGE_SCRIPTS,
  findScript,
  type Channel,
  type MessageChoice,
  type MessageScript,
  type VendorOrder,
} from '@/content/messages';
import type { NpcProfile } from '@/types';
import type { BookingSpec } from './deals';
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

/** 채널은 사람마다 정해져 있습니다 (npcs.json 의 `channel`). */
export function channelForNpc(npc: NpcProfile | undefined): Channel {
  return npc?.channel ?? 'telegraph';
}

/** 이 사람이 옮겨갈 의향이 있는지. 거절하면 대화는 그대로 남습니다. */
export function acceptsChannel(npc: NpcProfile, channel: Channel): boolean {
  if (npc.channel === channel) return true;
  return npc.altChannel === channel;
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
  /** Everyone the player could hear from; the person decides the channel. */
  npcs: readonly NpcProfile[];
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

  const known = new Set(input.npcs.map((npc) => npc.id));
  const used = new Set(pending.map((message) => message.scriptId));
  // One thread per person: someone who is already waiting does not write again.
  const waiting = new Set(pending.map((message) => message.npcId));
  const pool = MESSAGE_SCRIPTS.filter(
    (script) => !used.has(script.id) && known.has(script.from) && !waiting.has(script.from),
  );
  if (pool.length === 0) return null;

  const script = pool[Math.floor(rng() * pool.length) % pool.length];
  const npc = input.npcs.find((entry) => entry.id === script.from);
  return {
    id: `msg-${nanoid(6)}`,
    scriptId: script.id,
    npcId: script.from,
    channel: channelForNpc(npc),
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
  /** Set when this answer booked an appointment for the Trade app. */
  booking?: BookingSpec;
  /** Set when this answer ordered stock from a supplier. */
  order?: VendorOrder;
}

const emptyAnswer = (message: InboxMessage, error: string): AnswerResult => ({
  ok: false,
  error,
  effects: { heat: 0, trust: 0, cash: 0 },
  reply: '',
  outcome: '',
  channel: message.channel,
  moved: false,
});

/**
 * Applies one choice to one message. The script data owns the numbers; the NPC
 * owns the channels, so a "let's switch apps" offer can be refused.
 */
export function resolveAnswer(
  message: InboxMessage,
  choiceId: string,
  npc?: NpcProfile,
  trust = 100,
): AnswerResult {
  const script = findScript(message.scriptId);
  if (!script) return emptyAnswer(message, '대화 내용을 찾을 수 없습니다.');

  const choice = script.choices.find((entry) => entry.id === choiceId);
  if (!choice) return emptyAnswer(message, '선택할 수 없는 답장입니다.');

  const effects = {
    heat: choice.effect?.heat ?? 0,
    trust: choice.effect?.trust ?? 0,
    cash: choice.effect?.cash ?? 0,
  };

  // Suppliers only trade with people they trust.
  if (choice.order) {
    if (choice.minTrust !== undefined && trust < choice.minTrust) {
      return {
        ok: true,
        effects: { ...effects, trust: effects.trust - 1 },
        reply: choice.reply,
        outcome: `${npc?.name ?? '상대'}가 아직은 상대할 단계가 아니라며 거절했다. (신뢰 ${choice.minTrust} 필요)`,
        channel: message.channel,
        moved: false,
      };
    }
    return {
      ok: true,
      effects,
      reply: choice.reply,
      outcome: choice.outcome,
      channel: message.channel,
      moved: false,
      order: choice.order,
    };
  }

  // Asking someone to move apps only works if they are willing.
  if (choice.moveTo && choice.moveTo !== message.channel) {
    const allowed = npc ? acceptsChannel(npc, choice.moveTo) : false;
    if (!allowed) {
      return {
        ok: true,
        effects: { ...effects, trust: effects.trust - 1 },
        reply: choice.reply,
        outcome: `${npc?.name ?? '상대'}는 ${channelLabel(message.channel)}만 쓴다며 거절했다.`,
        channel: message.channel,
        moved: false,
      };
    }
    return {
      ok: true,
      effects,
      reply: choice.reply,
      outcome: choice.outcome,
      channel: choice.moveTo,
      moved: true,
    };
  }

  return {
    ok: true,
    effects,
    reply: choice.reply,
    outcome: choice.outcome,
    channel: message.channel,
    moved: false,
    booking: choice.booking,
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
