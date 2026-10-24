/**
 * Messenger types and mock data for Telegraph, Ex, MessagesCall.
 * All content is fictional game content.
 */

export interface MessengerContact {
  id: string;
  name: string;
  handle: string;
  avatar: string; // emoji or gradient
  status: 'online' | 'offline' | 'away' | 'typing';
  lastSeen?: string;
  identity: 'realname' | 'alias';
  verified: boolean;
  bio?: string;
}

export interface MessengerMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string; // ISO game time
  status: 'sending' | 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'system' | 'timer';
  expiryTimer?: number; // seconds for auto-delete
}

export interface Conversation {
  id: string;
  participants: MessengerContact[];
  messages: MessengerMessage[];
  unreadCount: number;
  pinned: boolean;
  muted: boolean;
  autoDeleteTimer?: number; // seconds
  lastActivity: string;
}

// Telegraph - Secret messenger contacts
export const TELEGRAPH_CONTACTS: MessengerContact[] = [
  {
    id: 't-1',
    name: 'ShadowBroker',
    handle: '@shadowbroker',
    avatar: '🕶️',
    status: 'online',
    identity: 'alias',
    verified: true,
    bio: '신뢰도 98% · 에스크로 전문',
  },
  {
    id: 't-2',
    name: 'SilentRunner',
    handle: '@silentrunner',
    avatar: '🏃‍♂️',
    status: 'away',
    lastSeen: '2026-03-14T20:30:00.000Z',
    identity: 'alias',
    verified: true,
    bio: '정보 브로커 · 샘플 테스트 가능',
  },
  {
    id: 't-3',
    name: 'CryptoWallet',
    handle: '@cryptowallet',
    avatar: '💰',
    status: 'online',
    identity: 'alias',
    verified: true,
    bio: '자동 입금 알림 봇',
  },
  {
    id: 't-4',
    name: 'MarketWatch',
    handle: '@marketwatch',
    avatar: '📊',
    status: 'online',
    identity: 'alias',
    verified: true,
    bio: '시장 동향 자동 알림',
  },
  {
    id: 't-5',
    name: 'AnonymousTipster',
    handle: '@anontipster',
    avatar: '🎭',
    status: 'offline',
    lastSeen: '2026-03-13T15:40:00.000Z',
    identity: 'alias',
    verified: false,
    bio: '익명 제보 · 검증 필요',
  },
];

// Telegraph conversations
export const TELEGRAPH_CONVERSATIONS: Conversation[] = [
  {
    id: 'tc-1',
    participants: [TELEGRAPH_CONTACTS[0]],
    unreadCount: 2,
    pinned: true,
    muted: false,
    autoDeleteTimer: 3600, // 1 hour
    lastActivity: '2026-03-14T22:15:00.000Z',
    messages: [
      {
        id: 'tm-1',
        conversationId: 'tc-1',
        senderId: 't-1',
        senderName: 'ShadowBroker',
        content: '제시하신 가격에 맞춰드릴 수 있습니다. 내일 밤 10시 거래 가능합니까?',
        timestamp: '2026-03-14T22:15:00.000Z',
        status: 'read',
        type: 'text',
      },
      {
        id: 'tm-2',
        conversationId: 'tc-1',
        senderId: 'me',
        senderName: 'NightOwl',
        content: '가능합니다. 장소는 지난번과 동일하게.',
        timestamp: '2026-03-14T22:16:00.000Z',
        status: 'read',
        type: 'text',
      },
      {
        id: 'tm-3',
        conversationId: 'tc-1',
        senderId: 't-1',
        senderName: 'ShadowBroker',
        content: '확인했습니다. 에스크로 생성해두겠습니다. 1시간 후 자동 삭제됩니다.',
        timestamp: '2026-03-14T22:17:00.000Z',
        status: 'delivered',
        type: 'timer',
        expiryTimer: 3600,
      },
    ],
  },
  {
    id: 'tc-2',
    participants: [TELEGRAPH_CONTACTS[1]],
    unreadCount: 0,
    pinned: false,
    muted: false,
    autoDeleteTimer: 86400, // 24 hours
    lastActivity: '2026-03-13T23:10:00.000Z',
    messages: [
      {
        id: 'tm-4',
        conversationId: 'tc-2',
        senderId: 't-2',
        senderName: 'SilentRunner',
        content: '새 공급자 "PhantomSource" 등장. 품질 검증 필요. 샘플 주문 가능.',
        timestamp: '2026-03-13T23:10:00.000Z',
        status: 'read',
        type: 'text',
      },
      {
        id: 'tm-5',
        conversationId: 'tc-2',
        senderId: 'me',
        senderName: 'NightOwl',
        content: '정보 고마워. 샘플 5개 주문해볼게.',
        timestamp: '2026-03-13T23:11:00.000Z',
        status: 'read',
        type: 'text',
      },
    ],
  },
  {
    id: 'tc-3',
    participants: [TELEGRAPH_CONTACTS[2]],
    unreadCount: 1,
    pinned: false,
    muted: true,
    autoDeleteTimer: 0,
    lastActivity: '2026-03-14T18:22:00.000Z',
    messages: [
      {
        id: 'tm-6',
        conversationId: 'tc-3',
        senderId: 't-3',
        senderName: 'CryptoWallet',
        content: '입금 확인: 0.85 BTC가 귀하의 지갑으로 입금되었습니다. 3 컨펌 완료.',
        timestamp: '2026-03-14T18:22:00.000Z',
        status: 'delivered',
        type: 'text',
      },
    ],
  },
  {
    id: 'tc-4',
    participants: [TELEGRAPH_CONTACTS[3]],
    unreadCount: 0,
    pinned: false,
    muted: true,
    autoDeleteTimer: 0,
    lastActivity: '2026-03-14T12:00:00.000Z',
    messages: [
      {
        id: 'tm-7',
        conversationId: 'tc-4',
        senderId: 't-4',
        senderName: 'MarketWatch',
        content: '[경고] QuickDrop 시장 폐쇄 임박 징후. 관리자 지갑 이동 감지. 즉시 자산 회수 권고.',
        timestamp: '2026-03-14T21:30:00.000Z',
        status: 'read',
        type: 'text',
      },
    ],
  },
];

// Ex - Social feed posts
export interface ExPost {
  id: string;
  author: MessengerContact;
  content: string;
  timestamp: string;
  likes: number;
  liked: boolean;
  replies: number;
  reposts: number;
  image?: string;
  isClue?: boolean;
  clueText?: string;
}

export const EX_POSTS: ExPost[] = [
  {
    id: 'ex-1',
    author: {
      id: 'ex-u1',
      name: 'DarkTrader',
      handle: '@darktrader',
      avatar: '🌑',
      status: 'online',
      identity: 'alias',
      verified: true,
      bio: '풀타임 트레이더 · 리스크 관리',
    },
    content: 'NightBazaar 요즘 좀 이상함. 관리자 키 바뀐 거 아무도 말 안 함?',
    timestamp: '2026-03-14T21:45:00.000Z',
    likes: 47,
    liked: false,
    replies: 12,
    reposts: 8,
    isClue: true,
    clueText: 'NightBazaar 관리자 키 교체 의심',
  },
  {
    id: 'ex-2',
    author: {
      id: 'ex-u2',
      name: 'CryptoKid',
      handle: '@cryptokid',
      avatar: '💎',
      status: 'away',
      identity: 'alias',
      verified: false,
      bio: '코인만 함 · NFT 안 함',
    },
    content: 'QuickDrop 드디어 터지나? 관리자 지갑 3개 동시에 움직이네 ㄷㄷ',
    timestamp: '2026-03-14T21:35:00.000Z',
    likes: 89,
    liked: true,
    replies: 34,
    reposts: 21,
    isClue: true,
    clueText: 'QuickDrop 관리자 자금 이동',
  },
  {
    id: 'ex-3',
    author: {
      id: 'ex-u3',
      name: 'InfoBroker',
      handle: '@infobroker',
      avatar: '📰',
      status: 'online',
      identity: 'alias',
      verified: true,
      bio: '검증된 정보만 공유 · 유료 상담',
    },
    content: '신규 시장 PhantomSource 샘플 테스트 결과: Grade A 순도 94%. 가격 대비 훌륭함. 단, 운영 5일차라 리스크 큼.',
    timestamp: '2026-03-14T20:20:00.000Z',
    likes: 156,
    liked: false,
    replies: 28,
    reposts: 45,
  },
  {
    id: 'ex-4',
    author: {
      id: 'ex-u4',
      name: 'OldSchool',
      handle: '@oldschool',
      avatar: '👴',
      status: 'offline',
      identity: 'alias',
      verified: true,
      bio: '2015년부터 함 · 살아남는 법만 압니다',
    },
    content: '요즘 애들은 에스크로도 안 쓰고 직거래 하더라. 내 돈 다 털린 적 있어서 앎. 제발 에스크로 써라.',
    timestamp: '2026-03-14T19:00:00.000Z',
    likes: 234,
    liked: false,
    replies: 67,
    reposts: 89,
  },
  {
    id: 'ex-5',
    author: {
      id: 'ex-u5',
      name: 'NightOwl',
      handle: '@nightowl',
      avatar: '🦉',
      status: 'online',
      identity: 'alias',
      verified: true,
      bio: '조용히 관찰 중',
    },
    content: 'ShadowBroker랑 내일 거래 잡힘. 믿을만함.',
    timestamp: '2026-03-14T22:20:00.000Z',
    likes: 3,
    liked: false,
    replies: 1,
    reposts: 0,
  },
  {
    id: 'ex-6',
    author: {
      id: 'ex-u6',
      name: 'MarketWatcher',
      handle: '@marketwatcher',
      avatar: '👁️',
      status: 'online',
      identity: 'alias',
      verified: true,
      bio: '시장 감시 봇 · 24/7 모니터링',
    },
    content: '📈 주간 리포트: 전체 거래량 -12%, 사기 신고 +40%. 신규 시장 3개 등장. 자세한 건 다크웹 데일리 참조.',
    timestamp: '2026-03-14T12:00:00.000Z',
    likes: 78,
    liked: false,
    replies: 15,
    reposts: 32,
  },
];

// MessagesCall - Realname contacts (family, friends)
export const MESSAGES_CALL_CONTACTS: MessengerContact[] = [
  {
    id: 'mc-1',
    name: '어머니',
    handle: 'mom',
    avatar: '👩',
    status: 'online',
    lastSeen: '2026-03-14T21:30:00.000Z',
    identity: 'realname',
    verified: true,
    bio: '가족',
  },
  {
    id: 'mc-2',
    name: '아버지',
    handle: 'dad',
    avatar: '👨',
    status: 'offline',
    lastSeen: '2026-03-14T18:00:00.000Z',
    identity: 'realname',
    verified: true,
    bio: '가족',
  },
  {
    id: 'mc-3',
    name: '동생 (지훈)',
    handle: 'jihoon',
    avatar: '👦',
    status: 'online',
    lastSeen: '2026-03-14T22:00:00.000Z',
    identity: 'realname',
    verified: true,
    bio: '가족',
  },
  {
    id: 'mc-4',
    name: '김민수',
    handle: 'minsu',
    avatar: '🍻',
    status: 'online',
    lastSeen: '2026-03-14T21:45:00.000Z',
    identity: 'realname',
    verified: true,
    bio: '대학 동기 · 주말에 맥주',
  },
  {
    id: 'mc-5',
    name: '이서연',
    handle: 'seoyeon',
    avatar: '📚',
    status: 'away',
    lastSeen: '2026-03-14T20:00:00.000Z',
    identity: 'realname',
    verified: true,
    bio: '직장 동료 · 프로젝트 팀',
  },
  {
    id: 'mc-6',
    name: '박대리',
    handle: 'parkdaeri',
    avatar: '☕',
    status: 'offline',
    lastSeen: '2026-03-14T19:00:00.000Z',
    identity: 'realname',
    verified: true,
    bio: '직장 상사 · 카카오톡으로 연락',
  },
];

export const MESSAGES_CALL_CONVERSATIONS: Conversation[] = [
  {
    id: 'mcc-1',
    participants: [MESSAGES_CALL_CONTACTS[0]],
    unreadCount: 1,
    pinned: true,
    muted: false,
    lastActivity: '2026-03-14T21:30:00.000Z',
    messages: [
      {
        id: 'mcm-1',
        conversationId: 'mcc-1',
        senderId: 'mc-1',
        senderName: '어머니',
        content: '철수야, 주말에 시간 되면 집에 들러. 김치찌개 해놨으니까 밥 먹고 가.',
        timestamp: '2026-03-14T18:22:00.000Z',
        status: 'read',
        type: 'text',
      },
      {
        id: 'mcm-2',
        conversationId: 'mcc-1',
        senderId: 'mc-1',
        senderName: '어머니',
        content: '반찬도 좀 챙겨줄게. 날씨 쌀쌀하니까 따뜻하게 입고 다녀.',
        timestamp: '2026-03-14T18:23:00.000Z',
        status: 'read',
        type: 'text',
      },
      {
        id: 'mcm-3',
        conversationId: 'mcc-1',
        senderId: 'me',
        senderName: '김철수',
        content: '네 엄마, 토요일 오후에 갈게. 고마워!',
        timestamp: '2026-03-14T18:25:00.000Z',
        status: 'read',
        type: 'text',
      },
      {
        id: 'mcm-4',
        conversationId: 'mcc-1',
        senderId: 'mc-1',
        senderName: '어머니',
        content: '그래, 조심히 와. 사랑해 ❤️',
        timestamp: '2026-03-14T21:30:00.000Z',
        status: 'delivered',
        type: 'text',
      },
    ],
  },
  {
    id: 'mcc-2',
    participants: [MESSAGES_CALL_CONTACTS[3]],
    unreadCount: 0,
    pinned: false,
    muted: false,
    lastActivity: '2026-03-14T20:15:00.000Z',
    messages: [
      {
        id: 'mcm-5',
        conversationId: 'mcc-2',
        senderId: 'mc-3',
        senderName: '김민수',
        content: '야 이번 주말에 한잔 할래? 새로 생긴 곳 있는데 평 좋다더라.',
        timestamp: '2026-03-14T19:45:00.000Z',
        status: 'read',
        type: 'text',
      },
      {
        id: 'mcm-6',
        conversationId: 'mcc-2',
        senderId: 'me',
        senderName: '김철수',
        content: '좋지! 토요일 7시 어때?',
        timestamp: '2026-03-14T19:46:00.000Z',
        status: 'read',
        type: 'text',
      },
      {
        id: 'mcm-7',
        conversationId: 'mcc-2',
        senderId: 'mc-3',
        senderName: '김민수',
        content: 'ㅇㅋ 그럼 토요일에 보자 ㅋㅋ',
        timestamp: '2026-03-14T20:15:00.000Z',
        status: 'read',
        type: 'text',
      },
    ],
  },
  {
    id: 'mcc-3',
    participants: [MESSAGES_CALL_CONTACTS[4]],
    unreadCount: 2,
    pinned: false,
    muted: false,
    lastActivity: '2026-03-14T21:00:00.000Z',
    messages: [
      {
        id: 'mcm-8',
        conversationId: 'mcc-3',
        senderId: 'mc-4',
        senderName: '이서연',
        content: '철수 씨, 내일 회의 자료 미리 검토해주실 수 있나요? 3시까지 부탁드려요.',
        timestamp: '2026-03-14T17:30:00.000Z',
        status: 'read',
        type: 'text',
      },
      {
        id: 'mcm-9',
        conversationId: 'mcc-3',
        senderId: 'mc-4',
        senderName: '이서연',
        content: '급한 건 아니고 여유 있으실 때만 봐주세요!',
        timestamp: '2026-03-14T17:31:00.000Z',
        status: 'read',
        type: 'text',
      },
      {
        id: 'mcm-10',
        conversationId: 'mcc-3',
        senderId: 'me',
        senderName: '김철수',
        content: '네, 퇴근 전에 확인하고 회신드릴게요.',
        timestamp: '2026-03-14T18:00:00.000Z',
        status: 'read',
        type: 'text',
      },
    ],
  },
  {
    id: 'mcc-4',
    participants: [MESSAGES_CALL_CONTACTS[2]],
    unreadCount: 0,
    pinned: false,
    muted: false,
    lastActivity: '2026-03-14T16:00:00.000Z',
    messages: [
      {
        id: 'mcm-11',
        conversationId: 'mcc-4',
        senderId: 'mc-2',
        senderName: '동생 (지훈)',
        content: '형, 새 폰 샀어? 내 꺼 바꿔줘 ㅋㅋ',
        timestamp: '2026-03-14T15:30:00.000Z',
        status: 'read',
        type: 'text',
      },
      {
        id: 'mcm-12',
        conversationId: 'mcc-4',
        senderId: 'me',
        senderName: '김철수',
        content: '아직 안 샀어. 다음 달에나 살 듯.',
        timestamp: '2026-03-14T15:35:00.000Z',
        status: 'read',
        type: 'text',
      },
      {
        id: 'mcm-13',
        conversationId: 'mcc-4',
        senderId: 'mc-2',
        senderName: '동생 (지훈)',
        content: '에이 아쉽네. 그럼 나중에 ㅂㅂ',
        timestamp: '2026-03-14T16:00:00.000Z',
        status: 'read',
        type: 'text',
      },
    ],
  },
];