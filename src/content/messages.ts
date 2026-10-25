/**
 * 메신저 대사/선택지 — 편집 방법
 *
 *  - 배열에 항목을 추가/삭제하면 게임에 바로 반영됩니다. 코드 수정 불필요.
 *  - `from` 은 `src/data/npcs.json` 의 id 입니다.
 *  - **채널은 사람마다 정해져 있습니다** (npcs.json 의 `channel`). 그래서 어느 앱으로
 *    메시지가 올지는 상대가 결정합니다. `altChannel` 이 있으면 "옮기자"가 성사됩니다.
 *  - `choices[].effect` 숫자가 실제 게임 효과입니다.
 *      heat: +면 위험 상승, trust: +면 단골 신뢰 상승, cash: 즉시 현금 변동
 *  - `choices[].moveTo` 는 "다른 앱으로 옮기자"는 제안입니다. 상대가 받아주지 않으면
 *    거절당하고 신뢰가 조금 떨어집니다.
 *  - `choices[].booking` 은 **약속(예약 판매)** 을 만듭니다. 그 약속이 거래 앱의
 *    "약속" 목록에 뜨고, 기한 안에 물량을 넘기면 돈을 받습니다.
 *      productId: src/data/products.json 의 id
 *      qty: 개수 / dueMinutes: 게임 분 단위 기한 / priceFactor: 시세 대비 배수(1 = 시세)
 */
import type { MessageChannel } from '@/types';
import type { BookingSpec } from '@/game/deals';

export type Channel = MessageChannel;

export interface MessageChoice {
  id: string;
  /** 버튼에 보이는 문구. */
  label: string;
  /** 내가 보내는 답장 (말풍선). */
  reply: string;
  /** 결과 설명. */
  outcome: string;
  effect?: { heat?: number; trust?: number; cash?: number };
  /** 이 제안을 하면 (상대가 허락할 때) 다른 메신저로 옮겨집니다. */
  moveTo?: Channel;
  /** 이 답장으로 성사되는 약속. */
  booking?: BookingSpec;
}

export interface MessageScript {
  id: string;
  /** npcs.json 의 id. */
  from: string;
  /** 게임 분 단위 도착 간격(참고용). 실제 도착은 엔진이 굴립니다. */
  delayMinutes: [number, number];
  /** 상대가 먼저 보낸 메시지. */
  opener: string;
  choices: MessageChoice[];
}

export const MESSAGE_SCRIPTS: MessageScript[] = [
  {
    id: 'msg-dal-ask',
    from: 'npc-dal',
    delayMinutes: [20, 90],
    opener: '그거 아직 있어? 오늘 밤에 볼 수 있으면 좋겠는데.',
    choices: [
      {
        id: 'yes',
        label: '있다고 답하고 약속을 잡는다',
        reply: '있어. 3개 잡아둘게. 6시까지 오면 돼.',
        outcome: '약속이 잡혔다. 거래 앱의 "약속"에서 물량을 넘기면 된다.',
        effect: { trust: 4, heat: 1 },
        booking: { productId: 'product-pill', qty: 3, dueMinutes: 360 },
      },
      {
        id: 'move-phone',
        label: '문자로 옮기자고 한다',
        reply: '여긴 좀 그렇고 문자로 하자.',
        outcome: '달이는 익명 앱이 편하다며 거절했다.',
        effect: { trust: -1 },
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
    delayMinutes: [15, 60],
    opener: '아까 그거 얼마라고? 좀 깎아줘.',
    choices: [
      {
        id: 'hold',
        label: '값을 유지한다',
        reply: '그 가격이면 남는 게 없어. 그대로 갈게.',
        outcome: '찐빵이 투덜대면서도 알겠다고 했다.',
        effect: { trust: 2 },
      },
      {
        id: 'cut',
        label: '10% 깎아주고 약속을 잡는다',
        reply: '10%만 빼줄게. 2개 잡아둘 테니 오늘 안에 와.',
        outcome: '약속이 잡혔다. 단가가 조금 낮다.',
        effect: { trust: 5 },
        booking: { productId: 'product-capsule', qty: 2, dueMinutes: 300, priceFactor: 0.9 },
      },
      {
        id: 'move-telegraph',
        label: '익명 앱으로 옮기자고 한다',
        reply: '번호 대신 다른 앱으로 하자.',
        outcome: '찐빵은 문자만 쓴다고 선을 그었다.',
        effect: { trust: -1 },
        moveTo: 'telegraph',
      },
    ],
  },
  {
    id: 'msg-yuna-appointment',
    from: 'npc-yuna',
    delayMinutes: [30, 120],
    opener: '오늘 밤에 시간 돼? 지난번처럼 조용한 데서 보자.',
    choices: [
      {
        id: 'ok',
        label: '약속을 잡는다',
        reply: '좋아. 4개 준비해둘게. 열한 시까지 와.',
        outcome: '약속이 잡혔다. 거래 앱에서 확인할 수 있다.',
        effect: { trust: 5, heat: 1 },
        booking: { productId: 'product-jelly', qty: 4, dueMinutes: 420 },
      },
      {
        id: 'move-phone',
        label: '문자로 옮기자고 한다',
        reply: '익명 앱은 답장이 늦어. 문자로 하자.',
        outcome: '유나가 흔쾌히 번호를 알려줬다. 대화가 문자로 옮겨졌다.',
        effect: { heat: 3, trust: 1 },
        moveTo: 'phone',
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
    delayMinutes: [40, 150],
    opener: '안녕하세요. 요즘 물건 상태가 어떤가요? 사진은 안 보내주셔도 됩니다.',
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
        effect: { heat: 2 },
      },
    ],
  },
  {
    id: 'msg-boss-bulk',
    from: 'npc-boss',
    delayMinutes: [60, 200],
    opener: '한 번에 쓸어갈 생각 있다. 단가 얘기하자.',
    choices: [
      {
        id: 'deal',
        label: '대량 약속을 잡는다',
        reply: '8개 잡아둘게. 값은 시세에서 15% 빼준다.',
        outcome: '큰 약속이 잡혔다. 기한이 짧으니 서둘러야 한다.',
        effect: { trust: 3 },
        booking: { productId: 'product-powder', qty: 8, dueMinutes: 240, priceFactor: 0.85 },
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
    delayMinutes: [25, 100],
    opener: '새벽에 잠깐 볼 수 있어? 조용할 때가 좋아서.',
    choices: [
      {
        id: 'dawn',
        label: '새벽 약속을 잡는다',
        reply: '3시에 보자. 2개 준비해둘게.',
        outcome: '새벽 약속이 잡혔다. 순찰은 줄지만 몸이 힘들다.',
        effect: { trust: 4, heat: 2 },
        booking: { productId: 'product-pill', qty: 2, dueMinutes: 480 },
      },
      {
        id: 'move-phone',
        label: '문자로 옮기자고 한다',
        reply: '익명 앱은 확인이 늦어. 문자로 하자.',
        outcome: '서 씨가 잠깐 고민하다 번호를 알려줬다.',
        effect: { heat: 3, trust: 1 },
        moveTo: 'phone',
      },
    ],
  },
  {
    id: 'msg-gray-probe',
    from: 'npc-gray',
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
