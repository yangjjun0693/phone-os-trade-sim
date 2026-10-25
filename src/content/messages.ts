/**
 * 메신저 대사/선택지 — 편집 방법
 *
 *  - 배열에 항목을 추가/삭제하면 게임에 바로 반영됩니다. 코드 수정 불필요.
 *  - `from` 은 `src/data/npcs.json` 의 id 를 씁니다.
 *  - `channel` 이 'either' 면 익명 앱/문자 중 하나로 무작위 도착합니다.
 *  - `choices[].effect` 의 숫자가 실제 게임 효과입니다.
 *      heat: +면 위험 상승, trust: +면 단골 신뢰 상승, cash: 즉시 현금 변동
 *  - `moveTo` 는 "다른 앱으로 대화를 옮기자"는 선택입니다. 옮기면 효과가 따로 붙습니다.
 */

export type Channel = 'telegraph' | 'phone';

export interface MessageChoice {
  id: string;
  /** 버튼에 보이는 문구. */
  label: string;
  /** 내가 보내는 답장 (말풍선). */
  reply: string;
  /** 결과 설명. */
  outcome: string;
  effect?: { heat?: number; trust?: number; cash?: number };
  /** 이 선택을 하면 대화가 다른 메신저로 옮겨집니다. */
  moveTo?: Channel;
}

export interface MessageScript {
  id: string;
  /** npcs.json 의 id. */
  from: string;
  /** 선호 채널. 'either' 는 무작위. */
  channel: 'either' | Channel;
  /** 도착 간격(게임 분). 스폰 확률과 함께 쓰입니다. */
  delayMinutes: [number, number];
  /** 상대가 먼저 보낸 메시지. */
  opener: string;
  choices: MessageChoice[];
}

export const MESSAGE_SCRIPTS: MessageScript[] = [
  {
    id: 'msg-dal-ask',
    from: 'npc-dal',
    channel: 'telegraph',
    delayMinutes: [20, 90],
    opener: '그거 아직 있어? 오늘 밤에 볼 수 있으면 좋겠는데.',
    choices: [
      {
        id: 'yes',
        label: '있다고 답한다',
        reply: '있어. 몇 개 필요해?',
        outcome: '달이가 수량을 정해서 다시 연락하겠다고 했다.',
        effect: { trust: 4, heat: 1 },
      },
      {
        id: 'move-phone',
        label: '문자로 옮기자고 한다',
        reply: '여긴 좀 그렇고 문자로 하자.',
        outcome: '달이가 번호를 물어봤다. 기록이 남는 쪽으로 옮겼다.',
        effect: { trust: 1, heat: 4 },
        moveTo: 'phone',
      },
      {
        id: 'later',
        label: '나중에 보자고 한다',
        reply: '오늘은 어려워. 내일 보자.',
        outcome: '달이가 짧게 답하고 조용해졌다.',
        effect: { trust: -2 },
      },
    ],
  },
  {
    id: 'msg-jjin-haggle',
    from: 'npc-jjin',
    channel: 'phone',
    delayMinutes: [15, 60],
    opener: '아까 그거 얼마라고? 좀 깎아줘.',
    choices: [
      {
        id: 'hold',
        label: '값을 유지한다',
        reply: '그 가격이면 남는 게 없어.',
        outcome: '찐빵이 투덜대면서도 알겠다고 했다.',
        effect: { trust: 2, heat: 0 },
      },
      {
        id: 'cut',
        label: '10% 깎아준다',
        reply: '10%만 빼줄게. 그 대신 오늘 안에 와.',
        outcome: '찐빵이 바로 오겠다고 했다. 대신 마진이 줄었다.',
        effect: { trust: 5, cash: -8_000 },
      },
      {
        id: 'move-telegraph',
        label: '익명 앱으로 옮기자고 한다',
        reply: '번호 대신 다른 앱으로 하자.',
        outcome: '찐빵이 앱을 새로 깔겠다고 했다. 번호가 지워진다.',
        effect: { heat: -3, trust: -1 },
        moveTo: 'telegraph',
      },
    ],
  },
  {
    id: 'msg-yuna-appointment',
    from: 'npc-yuna',
    channel: 'either',
    delayMinutes: [30, 120],
    opener: '오늘 11시에 지난번 그 자리 어때?',
    choices: [
      {
        id: 'ok',
        label: '좋다고 답한다',
        reply: '좋아. 11시에 보자.',
        outcome: '약속이 잡혔다. 지도에서 장소를 확인해야 한다.',
        effect: { trust: 5, heat: 1 },
      },
      {
        id: 'earlier',
        label: '더 이른 시간을 제안한다',
        reply: '11시엔 순찰이 있어. 9시로 하자.',
        outcome: '유나가 흔쾌히 시간을 옮겼다.',
        effect: { trust: 3, heat: -1 },
      },
      {
        id: 'cancel',
        label: '오늘은 취소한다',
        reply: '오늘은 안 될 것 같아. 미안.',
        outcome: '유나가 알겠다고만 답했다.',
        effect: { trust: -3 },
      },
    ],
  },
  {
    id: 'msg-mrpark-question',
    from: 'npc-mrpark',
    channel: 'either',
    delayMinutes: [40, 150],
    opener: '안녕하세요. 요즘 물건 상태가 어떤가요? 사진 같은 건 안 보내주셔도 됩니다.',
    choices: [
      {
        id: 'polite',
        label: '정중하게 답한다',
        reply: '상태는 좋습니다. 필요한 수량 알려주세요.',
        outcome: '상대가 너무 자세히 물어본다. 어딘가 이상하다.',
        effect: { heat: 6, trust: 1 },
      },
      {
        id: 'block',
        label: '차단한다',
        reply: '(대화를 종료했습니다)',
        outcome: '연락을 끊었다. 뒤끝이 있을 수 있다.',
        effect: { heat: -2, trust: -1 },
      },
      {
        id: 'bait',
        label: '일부러 애매하게 답한다',
        reply: '누구 소개로 연락하셨어요?',
        outcome: '상대가 한참 동안 입력 중이었다가 답을 안 했다.',
        effect: { heat: 2, trust: 0 },
      },
    ],
  },
  {
    id: 'msg-boss-bulk',
    from: 'npc-boss',
    channel: 'telegraph',
    delayMinutes: [60, 200],
    opener: '한 번에 쓸어갈 생각 있다. 단가 얘기하자.',
    choices: [
      {
        id: 'deal',
        label: '대량 조건으로 협상한다',
        reply: '수량 되면 15% 빼줄게.',
        outcome: '중간상이 수량을 적어 보냈다. 큰 거래가 될 수도 있다.',
        effect: { trust: 3, cash: -20_000 },
      },
      {
        id: 'small',
        label: '소량만 하겠다고 한다',
        reply: '지금은 여유가 없어. 다음에 보자.',
        outcome: '중간상이 흥미를 잃은 듯 답장이 짧아졌다.',
        effect: { trust: -1 },
      },
    ],
  },
  {
    id: 'msg-seo-dawn',
    from: 'npc-seo',
    channel: 'phone',
    delayMinutes: [25, 100],
    opener: '새벽에 잠깐 볼 수 있어? 조용할 때가 좋아서.',
    choices: [
      {
        id: 'dawn',
        label: '새벽에 만나기로 한다',
        reply: '3시에 보자. 조용한 쪽으로.',
        outcome: '새벽 약속이 잡혔다. 순찰은 줄지만 피곤하다.',
        effect: { trust: 4, heat: 2 },
      },
      {
        id: 'daytime',
        label: '낮에 보자고 한다',
        reply: '낮이 낫지 않아?',
        outcome: '서 씨가 낮에는 사람이 많다고 난색을 보였다.',
        effect: { trust: 0 },
      },
    ],
  },
  {
    id: 'msg-gray-probe',
    from: 'npc-gray',
    channel: 'either',
    delayMinutes: [50, 180],
    opener: '시세보다 싸게 준다던데, 어디서 받은 물건이에요?',
    choices: [
      {
        id: 'deflect',
        label: '출처를 말하지 않는다',
        reply: '그건 제 일이죠.',
        outcome: '상대가 더 캐묻지 않았다. 조금 물러섰다.',
        effect: { heat: 1 },
      },
      {
        id: 'trust',
        label: '아는 척 자세히 말한다',
        reply: '거래처가 있어서요. 소개해줄까요?',
        outcome: '상대가 아주 만족해했다. 대신 내 정보가 남았다.',
        effect: { heat: 9, trust: 2 },
      },
    ],
  },
];

export function findScript(id: string): MessageScript | undefined {
  return MESSAGE_SCRIPTS.find((script) => script.id === id);
}
