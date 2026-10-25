import { describe, expect, it } from 'vitest';
import { MESSAGE_SCRIPTS } from '@/content/messages';
import { npcs } from '@/data';
import {
  INBOX_LIMIT,
  MIN_GAP_MINUTES,
  channelLabel,
  expireInbox,
  resolveAnswer,
  rollArrival,
  unreadCount,
  type InboxMessage,
} from './messenger';

const NOW = '2026-03-15T02:00:00.000Z';
const minutesAgo = (minutes: number) =>
  new Date(new Date(NOW).getTime() - minutes * 60_000).toISOString();

function message(overrides: Partial<InboxMessage> = {}): InboxMessage {
  return {
    id: 'm1',
    scriptId: 'msg-dal-ask',
    npcId: 'npc-dal',
    channel: 'telegraph',
    arrivedAt: NOW,
    status: 'unread',
    ...overrides,
  };
}

describe('messenger content', () => {
  it('only writes in as somebody who exists', () => {
    const ids = new Set(npcs.map((npc) => npc.id));
    for (const script of MESSAGE_SCRIPTS) {
      expect(ids.has(script.from), script.id).toBe(true);
    }
  });

  it('gives every choice a label, a reply and an outcome', () => {
    for (const script of MESSAGE_SCRIPTS) {
      expect(script.choices.length).toBeGreaterThan(1);
      for (const choice of script.choices) {
        expect(choice.id.length).toBeGreaterThan(0);
        expect(choice.label.length).toBeGreaterThan(0);
        expect(choice.reply.length).toBeGreaterThan(0);
        expect(choice.outcome.length).toBeGreaterThan(0);
      }
      // Choice ids must be unique inside a script so answering is unambiguous.
      const ids = script.choices.map((choice) => choice.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('has at least one thread that starts on each messenger', () => {
    expect(MESSAGE_SCRIPTS.some((script) => script.channel === 'telegraph')).toBe(true);
    expect(MESSAGE_SCRIPTS.some((script) => script.channel === 'phone')).toBe(true);
  });
});

describe('arrivals', () => {
  it('waits for the minimum gap', () => {
    const arrival = rollArrival({
      now: NOW,
      lastAt: minutesAgo(MIN_GAP_MINUTES - 5),
      heat: 40,
      inbox: [],
      rng: () => 0,
    });
    expect(arrival).toBeNull();
  });

  it('can deliver a message once enough time has passed', () => {
    const arrival = rollArrival({
      now: NOW,
      lastAt: minutesAgo(MIN_GAP_MINUTES + 10),
      heat: 40,
      inbox: [],
      rng: () => 0,
    });
    expect(arrival).not.toBeNull();
    expect(arrival?.status).toBe('unread');
    expect(['telegraph', 'phone']).toContain(arrival?.channel);
  });

  it('stops filling the inbox at the limit', () => {
    const full = Array.from({ length: INBOX_LIMIT }, (_, index) =>
      message({ id: `m${index}`, scriptId: MESSAGE_SCRIPTS[index % MESSAGE_SCRIPTS.length].id }),
    );
    const arrival = rollArrival({
      now: NOW,
      lastAt: minutesAgo(MIN_GAP_MINUTES + 10),
      heat: 90,
      inbox: full,
      rng: () => 0,
    });
    expect(arrival).toBeNull();
  });

  it('does not repeat a thread that is still waiting', () => {
    const arrival = rollArrival({
      now: NOW,
      lastAt: minutesAgo(MIN_GAP_MINUTES + 10),
      heat: 10,
      inbox: [message({ scriptId: 'msg-dal-ask' })],
      rng: () => 0,
    });
    expect(arrival?.scriptId).not.toBe('msg-dal-ask');
  });
});

describe('answering', () => {
  it('applies the effects written in the content file', () => {
    const answer = resolveAnswer(message(), 'yes');
    expect(answer.ok).toBe(true);
    expect(answer.effects.trust).toBe(4);
    expect(answer.effects.heat).toBe(1);
    expect(answer.reply.length).toBeGreaterThan(0);
    expect(answer.outcome.length).toBeGreaterThan(0);
  });

  it('moves the thread when the player asks to switch apps', () => {
    const answer = resolveAnswer(message(), 'move-phone');
    expect(answer.moved).toBe(true);
    expect(answer.channel).toBe('phone');
  });

  it('rejects an unknown choice', () => {
    const answer = resolveAnswer(message(), 'nope');
    expect(answer.ok).toBe(false);
    expect(answer.error).toBeTruthy();
  });
});

describe('inbox helpers', () => {
  it('counts unread per channel', () => {
    const inbox = [
      message({ id: 'a' }),
      message({ id: 'b', channel: 'phone' }),
      message({ id: 'c', status: 'answered' }),
    ];
    expect(unreadCount(inbox)).toBe(2);
    expect(unreadCount(inbox, 'phone')).toBe(1);
  });

  it('drops conversations the player ignored for too long', () => {
    const stale = message({ id: 'old', arrivedAt: minutesAgo(60 * 30) });
    const fresh = message({ id: 'new', arrivedAt: minutesAgo(30) });
    const answered = message({ id: 'done', arrivedAt: minutesAgo(60 * 30), status: 'answered' });
    const kept = expireInbox([stale, fresh, answered], NOW).map((entry) => entry.id);
    expect(kept).toEqual(['new', 'done']);
  });

  it('labels the two channels differently', () => {
    expect(channelLabel('telegraph')).toBe('익명 앱');
    expect(channelLabel('phone')).toBe('문자');
  });
});
