/**
 * 피싱 메일 — 편집 방법
 *
 *  - 메일 앱(Gmall)에 뜨는 수상한 메일입니다. "확인" 하면 적힌 손해를 봅니다.
 *  - `open.cash`: 잃는 돈(양수로 적으면 그만큼 사라짐), `open.heat`: 오르는 heat
 *  - `open.note`: 무슨 일이 벌어졌는지 설명
 */

export interface PhishingMail {
  id: string;
  from: string;
  subject: string;
  preview: string;
  body: string[];
  open: { cash?: number; heat?: number; note: string };
  safeNote: string;
}

export const PHISHING_MAILS: PhishingMail[] = [
  {
    id: 'phish-bank',
    from: 'account-security@choco1ate-bank.kr',
    subject: '[긴급] 계좌 이상거래 확인 요청',
    preview: '본인 확인을 위해 링크를 눌러주세요.',
    body: [
      '고객님의 계좌에서 이상거래가 감지되었습니다.',
      '아래 링크에서 본인 확인을 완료하지 않으면 계좌가 정지됩니다.',
      '확인: hxxp://choco1ate-bank.kr.verify-account.support',
    ],
    open: {
      cash: 250_000,
      heat: 3,
      note: '가짜 페이지에 정보를 입력했다. 연결된 계좌에서 돈이 빠져나갔다.',
    },
    safeNote: '주소에 숫자 1과 0이 섞여 있었다. 열지 않았다.',
  },
  {
    id: 'phish-market',
    from: 'no-reply@nightbazaar-support.onion',
    subject: '미수령 주문이 있습니다',
    preview: '주문 확인 링크가 만료되기 전에 확인하세요.',
    body: [
      '지난 주문에 대한 배송 정보를 확인하지 않았습니다.',
      '만료되면 물량이 회수됩니다.',
      '확인: hxxp://nightbazaar-support.onion/claim',
    ],
    open: {
      heat: 6,
      note: '가짜 마켓 페이지였다. 접속 기록이 남았다.',
    },
    safeNote: '한 번도 주문하지 않은 사이트였다. 그냥 지웠다.',
  },
  {
    id: 'phish-vendor',
    from: 'mnl.buyer@mail.onion',
    subject: '선입금하면 50% 할인',
    preview: '오늘만 가능한 조건입니다.',
    body: [
      '먼저 입금하면 다음 주문을 절반 값에 넘긴다.',
      '계좌는 아래와 같다.',
      '…실제로는 물건이 오지 않았다는 후기가 여러 건 있었다.',
    ],
    open: {
      cash: 120_000,
      note: '입금하고 기다렸지만 답이 없었다.',
    },
    safeNote: '말이 되는 조건이 아니었다.',
  },
];
