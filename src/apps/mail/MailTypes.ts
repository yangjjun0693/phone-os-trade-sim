/**
 * Mail types and mock data for Gmail and Protean apps.
 * All content is fictional game content.
 */

export interface MailMessage {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  preview: string;
  body: string;
  date: string; // ISO string (game time)
  read: boolean;
  starred: boolean;
  labels: string[];
  attachments: number;
  identity: 'realname' | 'alias';
}

export interface MailFolder {
  id: string;
  name: string;
  count: number;
  icon: string;
}

// Gmail - Realname identity emails
export const GMAIL_MESSAGES: MailMessage[] = [
  {
    id: 'g-1',
    from: '국민은행',
    fromEmail: 'noreply@kbbank.co.kr',
    to: '김철수',
    subject: '[국민은행] 입금 알림: 1,250,000원',
    preview: '귀하의 계좌로 1,250,000원이 입금되었습니다. 잔액: 3,450,000원',
    body: `김철수 님 안녕하세요.

귀하의 계좌(123-456-789012)로 아래와 같이 입금되었습니다.

입금액: 1,250,000원
입금자: 박○○ (급여)
입금일시: 2026-03-14 09:00
거래 후 잔액: 3,450,000원

문의사항이 있으시면 고객센터(1588-9999)로 연락주시기 바랍니다.

국민은행 드림`,
    date: '2026-03-14T09:00:00.000Z',
    read: false,
    starred: false,
    labels: ['은행', '입금'],
    attachments: 0,
    identity: 'realname',
  },
  {
    id: 'g-2',
    from: '쿠팡',
    fromEmail: 'order@coupang.com',
    to: '김철수',
    subject: '[쿠팡] 주문하신 상품이 배송 출발했습니다',
    preview: '주문번호 20260314-12345 | 예상 도착: 3월 15일 (토)',
    body: `김철수 님, 주문해주셔서 감사합니다.

주문번호: 20260314-12345
주문일시: 2026-03-13 20:30
배송예정일: 2026-03-15 (토)

주문 내역:
- 무선 이어버드 프로 × 1 (89,000원)
- USB-C 허브 7in1 × 1 (34,900원)

배송 조회: https://coupang.com/track/20260314-12345

쿠팡 드림`,
    date: '2026-03-13T20:30:00.000Z',
    read: true,
    starred: false,
    labels: ['쇼핑', '배송'],
    attachments: 0,
    identity: 'realname',
  },
  {
    id: 'g-3',
    from: '삼성카드',
    fromEmail: 'statement@samsungcard.com',
    to: '김철수',
    subject: '[삼성카드] 3월 카드 명세서 발송 안내',
    preview: '이용금액: 2,340,000원 | 최소납부액: 234,000원 | 납부기한: 3월 25일',
    body: `김철수 님, 3월 카드 명세서가 발송되었습니다.

이용기간: 2026-02-14 ~ 2026-03-13
총 이용금액: 2,340,000원
최소 납부액: 234,000원
납부 기한: 2026-03-25

주요 이용 내역:
- 쿠팡: 123,900원
- 배달의민족: 89,000원
- 넷플릭스: 17,000원
- 주유소: 450,000원
- 기타: 1,660,100원

자동이체 신청 시 납부일 전일 자동 출금됩니다.

삼성카드 드림`,
    date: '2026-03-13T10:00:00.000Z',
    read: true,
    starred: true,
    labels: ['카드', '명세서'],
    attachments: 1,
    identity: 'realname',
  },
  {
    id: 'g-4',
    from: '어머니',
    fromEmail: 'mom@hanmail.net',
    to: '김철수',
    subject: '주말에 시간 되면 들러',
    preview: '김치찌개 해놨으니까 밥 먹고 가. 반찬도 좀 챙겨갈게.',
    body: `철수야,

주말에 시간 되면 집에 들러.
김치찌개 맛있게 해놨으니까 밥 먹고 가.
반찬도 좀 챙겨줄게.

날씨 쌀쌀하니까 따뜻하게 입고 다녀.
엄마가`,
    date: '2026-03-13T18:22:00.000Z',
    read: false,
    starred: true,
    labels: ['가족'],
    attachments: 0,
    identity: 'realname',
  },
  {
    id: 'g-5',
    from: '건강보험공단',
    fromEmail: 'noreply@nhis.or.kr',
    to: '김철수',
    subject: '[국민건강보험] 건강검진 안내문',
    preview: '2026년도 일반건강검진 대상자입니다. 12월 31일까지 검진받으세요.',
    body: `김철수 님,

2026년도 일반건강검진 대상자로 선정되셨음을 안내드립니다.

검진 대상: 만 20세 이상 세대주 및 세대원
검진 기간: 2026-01-01 ~ 2026-12-31
검진 항목: 신체계측, 혈액검사, 요검사, 흉부방사선, 구강검진 등

지정 검진기관에서 무료로 검진받으실 수 있습니다.
가까운 검진기관은 건강보험공단 홈페이지에서 조회 가능합니다.

국민건강보험공단 드림`,
    date: '2026-03-12T09:00:00.000Z',
    read: true,
    starred: false,
    labels: ['공공', '건강'],
    attachments: 1,
    identity: 'realname',
  },
  {
    id: 'g-6',
    from: '지마켓',
    fromEmail: 'noreply@gmarket.co.kr',
    to: '김철수',
    subject: '[G마켓] 배송 완료: 무선 마우스 외 1건',
    preview: '문 앞 배송 완료되었습니다. 구매확정 부탁드립니다.',
    body: `김철수 님, 주문하신 상품이 배송 완료되었습니다.

주문번호: 20260311-98765
배송완료일: 2026-03-12 14:30

상품:
- 로지텍 무선 마우스 MX Master 3S (129,000원)
- 키보드 손목 받침대 (15,000원)

구매확정 시 포인트 1,440점 적립됩니다.

G마켓 드림`,
    date: '2026-03-12T14:30:00.000Z',
    read: true,
    starred: false,
    labels: ['쇼핑'],
    attachments: 0,
    identity: 'realname',
  },
  {
    id: 'g-7',
    from: '카카오뱅크',
    fromEmail: 'notice@kakaobank.com',
    to: '김철수',
    subject: '[카카오뱅크] 이체 완료 알림',
    preview: '이체금액: 500,000원 | 받는분: 이○○ | 잔액: 2,950,000원',
    body: `김철수 님, 이체가 완료되었습니다.

이체금액: 500,000원
받는분: 이○○ (이체메모: 생일축하)
보내는분: 김철수
이체일시: 2026-03-11 19:45
거래 후 잔액: 2,950,000원

카카오뱅크 드림`,
    date: '2026-03-11T19:45:00.000Z',
    read: true,
    starred: false,
    labels: ['은행', '이체'],
    attachments: 0,
    identity: 'realname',
  },
  {
    id: 'g-8',
    from: '네이버',
    fromEmail: 'security@naver.com',
    to: '김철수',
    subject: '[네이버] 새로운 로그인 알림',
    preview: '새로운 기기에서 로그인이 감지되었습니다. 본인이 아닐 경우 즉시 비밀번호를 변경하세요.',
    body: `김철수 님,

네이버 계정(ckim@naver.com)에 새로운 로그인이 감지되었습니다.

로그인 정보:
- 일시: 2026-03-11 08:15
- 기기: Windows Chrome
- 위치: 서울특별시 강남구 (IP 기반 추정)

본인이 직접 로그인한 것이 맞다면 안심하셔도 됩니다.
본인이 아닌 경우 즉시 비밀번호를 변경하고 2단계 인증을 설정하세요.

네이버 보안팀 드림`,
    date: '2026-03-11T08:15:00.000Z',
    read: false,
    starred: false,
    labels: ['보안', '알림'],
    attachments: 0,
    identity: 'realname',
  },
];

export const GMAIL_FOLDERS: MailFolder[] = [
  { id: 'inbox', name: '받은편지함', count: GMAIL_MESSAGES.filter(m => !m.read).length, icon: 'inbox' },
  { id: 'starred', name: '중요', count: GMAIL_MESSAGES.filter(m => m.starred).length, icon: 'star' },
  { id: 'sent', name: '보낸편지함', count: 12, icon: 'send' },
  { id: 'drafts', name: '임시보관함', count: 3, icon: 'file' },
  { id: 'spam', name: '스팸', count: 47, icon: 'alert-triangle' },
  { id: 'trash', name: '휴지통', count: 8, icon: 'trash' },
];

// Protean - Alias identity emails
export const PROTEAN_MESSAGES: MailMessage[] = [
  {
    id: 'p-1',
    from: 'ShadowBroker',
    fromEmail: 'broker@shadowmail.xyz',
    to: 'NightOwl',
    subject: 'Re: 가격 협상 건',
    preview: '제시하신 가격에 맞춰드릴 수 있습니다. 내일 밤 10시 거래 가능합니까?',
    body: `NightOwl 님,

제시하신 단가 $45에 맞춰드릴 수 있습니다.
수량 50개 기준 총 $2,250입니다.

내일 밤 10시(게임 시간) 동일 장소에서 거래 가능합니까?
확인되면 회신 바랍니다.

ShadowBroker`,
    date: '2026-03-14T22:15:00.000Z',
    read: false,
    starred: false,
    labels: ['거래', '협상'],
    attachments: 0,
    identity: 'alias',
  },
  {
    id: 'p-2',
    from: 'MarketWatch',
    fromEmail: 'alerts@marketwatch.dark',
    to: 'NightOwl',
    subject: '[경고] QuickDrop 시장 폐쇄 임박 징후',
    preview: '관리자 지갑 이동 감지. 예치금 인출 시작. 즉시 자산 회수 권고.',
    body: `>>> 자동 알림 시스템 <<<

대상 시장: QuickDrop (quickdrop.onion)
감지 시각: 2026-03-14 21:30

관리자 지갑(3개) 이체 활동 감지:
- 0x7a4b... → 0x9f2c... : 12.5 BTC
- 0x3d1e... → 0x8b7a... : 8.2 BTC
- 0x5f9c... → 0x1e4d... : 15.7 BTC

총 36.4 BTC 이동. 에스크로 잔고 89% 감소.

권고: 즉시 미수금 회수 및 신규 주문 중단.

MarketWatch Bot`,
    date: '2026-03-14T21:30:00.000Z',
    read: true,
    starred: true,
    labels: ['경고', '시장'],
    attachments: 0,
    identity: 'alias',
  },
  {
    id: 'p-3',
    from: 'CryptoWallet',
    fromEmail: 'noreply@cryptowallet.onion',
    to: 'NightOwl',
    subject: '입금 확인: 0.85 BTC',
    preview: '귀하의 지갑(1Btc...xyz)으로 0.85 BTC가 입금되었습니다. 3 컨펌 완료.',
    body: `입금 확인 알림

지갑 주소: 1BtcNightOwlWalletAddressxyz...
입금액: 0.85 BTC
TXID: a3f2b1c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t
컨펌: 3/3 완료
블록 높이: 832,451
시각: 2026-03-14 18:22 UTC

현재 잔액: 2.34 BTC

CryptoWallet Service`,
    date: '2026-03-14T18:22:00.000Z',
    read: true,
    starred: false,
    labels: ['입금', '암호화폐'],
    attachments: 0,
    identity: 'alias',
  },
  {
    id: 'p-4',
    from: 'AnonymousTipster',
    fromEmail: 'tip@anonymousmail.dark',
    to: 'NightOwl',
    subject: 'NightBazaar 관리자 교체 루머',
    preview: '내부 소스에 따르면 지난주 관리자 권한이 새로운 키로 이전됨. 주의 요망.',
    body: `NightOwl 님께,

신뢰할 수 있는 소스로부터 제보받은 내용입니다.

NightBazaar (nightbazaar.onion) 관리자 권한이
2026-03-08 경 새로운 PGP 키로 이전되었습니다.

기존 관리자 'OldAdmin' 키가 폐기되고
새 키 'NewAdmin_2026'가 등록됨.

이러한 갑작스러운 키 교체는 다음을 의미할 수 있습니다:
1. 정상적인 인수인계
2. 강제 인수 (해킹/압수)
3. 허니팟 전환 준비

현재까지 서비스 품질 저하는 보고되지 않았으나,
고액 거래 전 추가 검증 권장합니다.

익명의 제보자`,
    date: '2026-03-13T15:40:00.000Z',
    read: false,
    starred: true,
    labels: ['정보', '주의'],
    attachments: 0,
    identity: 'alias',
  },
  {
    id: 'p-5',
    from: 'EscrowBot',
    fromEmail: 'escrow@trustescrow.dark',
    to: 'NightOwl',
    subject: '에스크로 해제 완료: 주문 #ESC-20260310-0047',
    preview: '구매자 확정으로 1.2 BTC가 판매자 지갑으로 이체되었습니다.',
    body: `에스크로 해제 알림

주문 ID: ESC-20260310-0047
판매자: ShadowBroker
구매자: NightOwl
품목: Premium Grade A × 20
합의 금액: 1.2 BTC
에스크로 수수료: 0.024 BTC (2%)
판매자 수령액: 1.176 BTC
해제 시각: 2026-03-14 16:00 UTC

분쟁 없음. 거래 종결.

EscrowBot v3.2.1`,
    date: '2026-03-14T16:00:00.000Z',
    read: true,
    starred: false,
    labels: ['에스크로', '완료'],
    attachments: 0,
    identity: 'alias',
  },
  {
    id: 'p-6',
    from: 'DarkWebNews',
    fromEmail: 'news@darkwebdaily.onion',
    to: 'NightOwl',
    subject: '주간 시장 동향: 3월 2주차',
    preview: '전체 거래량 12% 감소. 신규 시장 3개 등장. 사기 신고 40% 증가.',
    body: `=== DarkWeb Daily Weekly Report ===
기간: 2026-03-08 ~ 2026-03-14

📊 전체 지표
- 총 거래량: 1,240 BTC (전주 대비 -12%)
- 활성 시장 수: 47개 (-3)
- 신규 등장: 3개 (SilkRoad3, AlphaBay-Reloaded, DreamMarket2)
- 폐쇄/휴면: 6개

⚠️ 위험 지표
- 사기 신고: 234건 (전주 대비 +40%)
- 허니팟 의심: 8개 시장
- 관리자 도주: 2건 (QuickDrop, DarkNetExpress)

💡 추천 행동
- 분산 거래 필수 (단일 시장 의존도 낮추기)
- 에스크로 사용률 100% 유지
- 신규 시장 30일 관찰 후 진입

전문 보기: hxxp://darkwebdaily.onion/weekly-2026-11

DarkWeb Daily 편집부`,
    date: '2026-03-14T12:00:00.000Z',
    read: true,
    starred: false,
    labels: ['뉴스', '동향'],
    attachments: 0,
    identity: 'alias',
  },
  {
    id: 'p-7',
    from: 'PGPKeyServer',
    fromEmail: 'keys@pgpkeyserver.dark',
    to: 'NightOwl',
    subject: '키 만료 임박 알림',
    preview: '귀하의 PGP 키(0xDEADBEEF)가 2026-04-01 만료됩니다. 갱신 필요.',
    body: `PGP 키 만료 알림

키 ID: 0xDEADBEEF
사용자: NightOwl <nightowl@protean.dark>
생성일: 2025-04-01
만료일: 2026-04-01 (18일 남음)
키 유형: RSA 4096

만료 전 새 키 생성 및 전환 권장:
1. 새 키 쌍 생성 (RSA 4096 또는 Ed25519)
2. 기존 연락처에 새 키 배포
3. 서명 이관 (기존 키로 새 키 서명)
4. 만료일 전 기존 키 폐기

자동 갱신 서비스: hxxp://pgpkeyserver.dark/auto-renew

PGP Key Server`,
    date: '2026-03-13T00:00:00.000Z',
    read: false,
    starred: false,
    labels: ['보안', '키관리'],
    attachments: 0,
    identity: 'alias',
  },
  {
    id: 'p-8',
    from: 'Contact: SilentRunner',
    fromEmail: 'silentrunner@anonmail.dark',
    to: 'NightOwl',
    subject: '새 공급처 정보',
    preview: '신규 공급자 "PhantomSource" 등장. 품질 검증 필요. 샘플 주문 가능.',
    body: `NightOwl,

새 공급자 정보 공유합니다.

공급자: PhantomSource (phantomsrc.onion)
등장일: 2026-03-10
취급 품목: Grade A, B 전 등급
가격: 시세 대비 -15% ~ -20%
최소 주문: 10개 단위
에스크로: 지원 (자체 에스크로만)

⚠️ 주의사항:
- 운영 4일차 신규 시장
- 리뷰 없음
- PGP 키 미공개
- 샘플 주문만 가능 (5개 단위)

샘플 주문해보고 품질 확인 후 결정하시길.

SilentRunner`,
    date: '2026-03-13T23:10:00.000Z',
    read: false,
    starred: false,
    labels: ['공급자', '정보공유'],
    attachments: 0,
    identity: 'alias',
  },
];

export const PROTEAN_FOLDERS: MailFolder[] = [
  { id: 'inbox', name: '받은편지함', count: PROTEAN_MESSAGES.filter(m => !m.read).length, icon: 'inbox' },
  { id: 'starred', name: '중요', count: PROTEAN_MESSAGES.filter(m => m.starred).length, icon: 'star' },
  { id: 'sent', name: '보낸편지함', count: 8, icon: 'send' },
  { id: 'drafts', name: '임시보관함', count: 1, icon: 'file' },
  { id: 'trash', name: '휴지통', count: 2, icon: 'trash' },
];

// Combined for search
export const ALL_MESSAGES = [...GMAIL_MESSAGES, ...PROTEAN_MESSAGES];