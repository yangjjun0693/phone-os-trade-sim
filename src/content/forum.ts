/**
 * 포럼 스레드 — 편집 방법: 배열에 항목을 추가/삭제하면 됩니다.
 *
 *  - `discovers` 에 마켓 id를 넣으면, 이 글을 읽는 순간 그 .onion 주소를
 *    "알게 됩니다" (Shade의 주소 목록에 추가).
 *  - `noise: true` 는 일부러 틀린 정보입니다. 플레이어가 걸러내야 합니다.
 */
export interface ForumThread {
  id: string;
  title: string;
  author: string;
  tag: '인텔' | '질문' | '경고' | '구인';
  /** 게임 시간 기준 몇 시간 전 글인지. */
  hoursAgo: number;
  body: string[];
  /** 읽으면 알게 되는 마켓 id. */
  discovers?: string;
  /** 읽었을 때 보여줄 보상 문구. */
  reward?: string;
  /** 의도적으로 틀린 정보. */
  noise?: boolean;
}

export const FORUM_THREADS: ForumThread[] = [
  {
    id: 'thread-lastcall',
    title: 'LastCall 폐쇄 전 재고 정리한다는데',
    author: 'midnight_owl',
    tag: '구인',
    hoursAgo: 3,
    body: [
      '관리자가 작별 인사 공지 올리고 재고 털고 있음.',
      '초대 코드 없으면 입구가 안 열린다고 하니 아래 코드 챙겨가라.',
      '코드: GAON-7F2',
    ],
    discovers: 'market-lastcall',
    reward: 'LastCall 초대 코드를 확보했습니다.',
  },
  {
    id: 'thread-nightbazaar',
    title: 'NightBazaar 아직 살아있냐',
    author: 'dal_runner',
    tag: '인텔',
    hoursAgo: 7,
    body: [
      '몇 년째 같은 도메인인데 아직도 열림. 에스크로도 정상.',
      '주소 바뀌면 여기에 다시 올린다.',
    ],
    discovers: 'market-nightbazaar',
    reward: 'NightBazaar 주소를 확인했습니다.',
  },
  {
    id: 'thread-quickdrop-warning',
    title: '⚠ QuickDrop 선입금 사기 당했다',
    author: 'burned_once',
    tag: '경고',
    hoursAgo: 11,
    body: [
      '입금하고 하루 기다렸는데 답이 없음. 계정 삭제됨.',
      '리뷰가 전부 같은 문체였는데 그때 눈치챘어야 했다.',
    ],
  },
  {
    id: 'thread-mirror-speed',
    title: 'ClearNet-Mirror 미러 속도 어떤가요',
    author: 'guest_4412',
    tag: '질문',
    hoursAgo: 20,
    body: [
      '원본은 느려서 미러로 보고 있는데 가격이 좀 더 붙는 것 같음.',
      'Tor 켜는 게 낫나?',
    ],
  },
  {
    id: 'thread-noise',
    title: '가온약국에서 알약 싸게 파는 방법 알려준다',
    author: 'totally_real',
    tag: '질문',
    hoursAgo: 30,
    body: [
      '선입금 하면 50% 할인해준다고 함. 나는 아직 못 받았지만 믿어보려고 함.',
    ],
    noise: true,
  },
];
