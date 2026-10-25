import { describe, expect, it } from 'vitest';
import { MESSAGE_SCRIPTS, findScript } from '@/content/messages';
import { npcs } from '@/data';
import {
  INBOX_LIMIT,
  MIN_GAP_MINUTES,
  acceptsChannel,
  channelForNpc,
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

const npcById = (id: string) => npcs.find((npc) => npc.id === id);

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
      const ids = script.choices.map((choice) => choice.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('points every booking at a real product with a sane deadline', () => {
    const products = new Set(['product-pill', 'product-jelly', 'product-capsule', 'product-powder', 'product-card']);
    const bookings = MESSAGE_SCRIPTS.flatMap((script) =>
      script.choices.flatMap((choice) => (choice.booking ? [choice.booking] : [])),
    );
    expect(bookings.length).toBeGreaterThan(2);
    for (const booking of bookings) {
      expect(products.has(booking.productId), booking.productId).toBe(true);
      expect(booking.qty).toBeGreaterThan(0);
      expect(booking.dueMinutes).toBeGreaterThanOrEqual(30);
    }
  });
});

describe('people own their channel', () => {
  it('gives every person a channel, and uses both channels', () => {
    const channels = new Set(npcs.map((npc) => npc.channel));
    expect(channels.has('telegraph')).toBe(true);
    expect(channels.has('phone')).toBe(true);
    for (const npc of npcs) {
      expect(['telegraph', 'phone']).toContain(npc.channel);
      if (npc.altChannel) expect(npc.altChannel).not.toBe(npc.channel);
    }
  });

  it('falls back to the anonymous app for unknown people', () => {
    expect(channelForNpc(undefined)).toBe('telegraph');
    expect(channelForNpc(npcById('npc-jjin'))).toBe('phone');
  });

  it('only accepts the apps a person actually uses', () => {
    const dal = npcById('npc-dal')!;
    const yuna = npcById('npc-yuna')!;
    expect(acceptsChannel(dal, 'phone')).toBe(false);
    expect(acceptsChannel(dal, 'telegraph')).toBe(true);
    expect(acceptsChannel(yuna, 'phone')).toBe(true);
  });
});

describe('arrivals', () => {
  it('waits for the minimum gap', () => {
    const arrival = rollArrival({
      now: NOW,
      lastAt: minutesAgo(MIN_GAP_MINUTES - 5),
      heat: 40,
      inbox: [],
      npcs,
      rng: () => 0,
    });
    expect(arrival).toBeNull();
  });

  it('delivers on the channel the sender uses', () => {
    const arrival = rollArrival({
      now: NOW,
      lastAt: minutesAgo(MIN_GAP_MINUTES + 10),
      heat: 40,
      inbox: [],
      npcs,
      rng: () => 0,
    });
    expect(arrival).not.toBeNull();
    expect(arrival?.status).toBe('unread');

    const npc = npcById(arrival!.npcId);
    expect(arrival?.channel).toBe(channelForNpc(npc));
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
      npcs,
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
      npcs,
      rng: () => 0,
    });
    expect(arrival?.scriptId).not.toBe('msg-dal-ask');
  });
});

describe('answering', () => {
  it('applies the effects and books the appointment written in the content file', () => {
    const answer = resolveAnswer(message(), 'yes', npcById('npc-dal'));
    expect(answer.ok).toBe(true);
    expect(answer.effects.trust).toBe(4);
    expect(answer.effects.heat).toBe(1);
    expect(answer.booking?.productId).toBe('product-pill');
    expect(answer.reply.length).toBeGreaterThan(0);
    expect(answer.outcome.length).toBeGreaterThan(0);
  });

  it('moves the thread when the person is willing', () => {
    const answer = resolveAnswer(
      message({ scriptId: 'msg-yuna-appointment', npcId: 'npc-yuna', channel: 'telegraph' }),
      'move-phone',
      npcById('npc-yuna'),
    );
    expect(answer.moved).toBe(true);
    expect(answer.channel).toBe('phone');
  });

  it('stays put when the person only uses one app', () => {
    const answer = resolveAnswer(message(), 'move-phone', npcById('npc-dal'));
    expect(answer.moved).toBe(false);
    expect(answer.channel).toBe('telegraph');
    // The choice's own penalty (-1) plus being turned down (-1).
    expect(answer.effects.trust).toBe(-2);
    expect(answer.outcome).toContain('거절');
  });

  it('rejects an unknown choice', () => {
    const answer = resolveAnswer(message(), 'nope', npcById('npc-dal'));
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

  it('every script belongs to a person who writes on a known channel', () => {
    for (const script of MESSAGE_SCRIPTS) {
      const npc = npcById(script.from);
      expect(npc, script.id).toBeDefined();
      expect(['telegraph', 'phone']).toContain(channelForNpc(npc));
    }
    expect(findScript('msg-dal-ask')?.opener.length).toBeGreaterThan(0);
  });
});
