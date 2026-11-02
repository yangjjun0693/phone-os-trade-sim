/**
 * 일상 웹 사이트 — 편집 방법
 *
 *  - 가짜 브라우저의 **마켓이 아닌** 사이트입니다. `market-*` 규칙과 별개로
 *    `BrowserSite` 배열에 객체 하나를 추가하면 시작 페이지 바로가기와
 *    Sleuth 검색 결과에 자동으로 뜹니다.
 *  - 공통 필드: id · name · tagline · kind · reach · url · accent · invite?
 *      - kind: 'search' | 'video' | 'classifieds' | 'wiki'
 *      - reach: 'clearnet' | 'mirror' | 'onion'  (마켓과 같은 망 계층)
 *      - url: `hxxp://...` 형식. 이미지/에셋 없음(전부 텍스트·CSS)
 *  - kind별 내용:
 *      - video.videos[]        : 영상. `lengthMin` 만큼 **게임 시계가 즉시** 흐릅니다.
 *                              `clue` 를 넣으면 시청 시 단서를 얻고, `trap` 이면 손해를 봅니다.
 *      - classifieds.listings[]: 중고 매물. 지금은 **구매 불가**(browse-only).
 *                              `clue`/`trap` 만 동작합니다.
 *      - wiki.articles[]       : 문서. `unlockId` 를 넣으면 읽을 때 그 주소를 알게 됩니다
 *                              (`discoverMarket` 재사용 — 마켓 id도, 사이트 id도 가능).
 *  - `clue` 는 `{ id, marketId, text, reliable }` 이고, 얻으면 `suspicionScore` 에 합쳐집니다.
 *  - `trap` 은 `{ cash?, heat?, note }` — 피싱 메일과 같은 모양입니다. 한 번만 발동합니다.
 *  - 모든 내용은 허구이며 실제 서비스·방법을 다루지 않습니다(§0).
 */

import type { BrowserSite } from '@/types';

export const BROWSER_SITES: BrowserSite[] = [
  {
    id: 'viewtube',
    name: 'ViewTube',
    tagline: '영상은 여기서 · 광고 없이',
    kind: 'video',
    reach: 'clearnet',
    url: 'hxxp://viewtube.kr',
    accent: '#e11d48',
    videos: [
      {
        id: 'vt-quickdrop',
        title: "'퀵드롭' 실사용 후기 — 3주 써봤습니다",
        channel: '거래 후기 채널',
        lengthMin: 21,
        views: '3.2만회',
        description: '포장 상태, 응대 속도, 환불까지 직접 겪은 대로 정리했습니다.',
        clue: {
          id: 'clue-vt-quickdrop',
          marketId: 'market-quickdrop',
          text: '영상 댓글에 "환불 못 받았다"는 사람이 여럿 달려 있다.',
          reliable: true,
        },
      },
      {
        id: 'vt-nightbazaar',
        title: '다크넷 마켓 주소 읽는 법 (기초)',
        channel: '밤의 지도',
        lengthMin: 34,
        views: '9.1만회',
        description: '주소를 외우는 대신 확인하는 습관을 설명합니다.',
        clue: {
          id: 'clue-vt-nightbazaar',
          marketId: 'market-nightbazaar',
          text: '영상 속 주소가 실제로 열리는 화면을 보여준다.',
          reliable: false,
        },
      },
      {
        id: 'vt-ambient',
        title: '새벽 도시 산책 (4K, 무음)',
        channel: '밤풍경',
        lengthMin: 42,
        views: '112만회',
        description: '그냥 도시. 아무 일도 일어나지 않습니다.',
      },
      {
        id: 'vt-free',
        title: '[무료] 프리미엄 시청권 나눔 이벤트',
        channel: '이벤트방송',
        lengthMin: 6,
        views: '88만회',
        description: '아래 설명란 링크에서 시청권을 받으세요.',
        trap: {
          cash: 90_000,
          heat: 2,
          note: '시청권을 받으려고 결제 정보를 입력했다. 결제만 됐고 채널은 사라졌다.',
        },
      },
    ],
  },
  {
    id: 'sleuth',
    name: 'Sleuth',
    tagline: '궁금한 건 여기서 찾으세요',
    kind: 'search',
    reach: 'clearnet',
    url: 'hxxp://sleuth.kr',
    accent: '#2563eb',
  },
  {
    id: 'junggomaeul',
    name: '중고마을',
    tagline: '동네 중고 거래 · 직거래',
    kind: 'classifieds',
    reach: 'clearnet',
    url: 'hxxp://junggo.kr',
    accent: '#f59e0b',
    listings: [
      {
        id: 'jg-burner',
        title: '미개통 폰 일괄 정리합니다 (박스만 뜯음)',
        price: 120_000,
        seller: '동네형',
        blurb: '여러 대 한 번에만 넘깁니다. 직거래 선호.',
        trap: {
          cash: 120_000,
          note: '선입금까지 했는데 판매자가 연락을 끊었다. 물건은 오지 않았다.',
        },
      },
      {
        id: 'jg-warehouse',
        title: '창고 자리 양도합니다 (항만 근처)',
        price: 300_000,
        seller: '항만근처',
        blurb: '면적 넉넉함. 계약은 직접 만나서.',
        clue: {
          id: 'clue-jg-lastcall',
          marketId: 'market-lastcall',
          text: '글에 쓰인 은어가 LastCall 폐쇄 공지의 문구와 똑같다.',
          reliable: true,
        },
      },
      {
        id: 'jg-boxes',
        title: '택배 상자 대량 처분 (내용물 없음)',
        price: 20_000,
        seller: '물류센터',
        blurb: '이삿짐 정리하고 남은 박스. 사이즈 뒤섞임.',
      },
    ],
  },
  {
    id: 'openpedia',
    name: 'OpenPedia',
    tagline: '누구나 고치는 백과사전',
    kind: 'wiki',
    reach: 'clearnet',
    url: 'hxxp://openpedia.kr',
    accent: '#6366f1',
    articles: [
      {
        id: 'wp-heat',
        title: '노출도 (heat)',
        category: '시스템',
        body: [
          '노출도는 한 사람이 얼마나 눈에 띄는지를 나타내는 값입니다.',
          '현금을 많이 들고 있을수록, 화려한 사이트에 들를수록 오릅니다.',
          '낮은 활동을 유지하면 시간이 지나면서 서서히 식습니다.',
        ],
      },
      {
        id: 'wp-escrow',
        title: '에스크로 (보관 결제)',
        category: '거래',
        body: [
          '중개인이 돈을 대신 맡았다가 물건이 확인되면 넘기는 방식입니다.',
          '수수료가 붙지만 서로를 믿지 못할 때 쓰입니다.',
          '문서의 예시 주소는 나이트바자의 에스크로 안내와 같습니다.',
        ],
        clue: {
          id: 'clue-wp-nightbazaar',
          marketId: 'market-nightbazaar',
          text: '문서가 예시로 든 주소가 나이트바자 에스크로 안내와 일치한다.',
          reliable: true,
        },
      },
      {
        id: 'wp-darkwiki',
        title: '다크넷 문서고 (심층 문서)',
        category: '심층',
        body: [
          '일반 백과에는 실리지 않는 문서를 따로 모아 둔 곳이 있습니다.',
          '초대를 받아야 열리며, 주소는 자주 바뀝니다.',
          '아래에 적힌 주소로 들어가면 같은 판의 심층 문서를 볼 수 있습니다.',
          'hxxp://openpedia.onion',
        ],
        unlockId: 'openpedia-onion',
      },
    ],
  },
  {
    id: 'openpedia-onion',
    name: 'OpenPedia .onion',
    tagline: '심층 문서고 · 초대 필요',
    kind: 'wiki',
    reach: 'onion',
    url: 'hxxp://openpedia.onion',
    accent: '#8b5cf6',
    invite: true,
    articles: [
      {
        id: 'dwp-lastcall',
        title: '문 닫는 마켓 목록',
        category: '감시',
        body: [
          '폐쇄를 예고한 마켓의 공지 원문을 모아 둡니다.',
          '정리 세일 기간에는 사기가 몰리니 주의하라는 경고가 붙습니다.',
          '목록 첫 줄에 LastCall의 주소와 공지가 그대로 적혀 있습니다.',
        ],
        unlockId: 'market-lastcall',
        clue: {
          id: 'clue-dwp-lastcall',
          marketId: 'market-lastcall',
          text: '문서에 적힌 주소가 폐쇄 공지를 올린 그 마켓이다.',
          reliable: true,
        },
      },
      {
        id: 'dwp-verify',
        title: '서명 확인하기',
        category: '안전',
        body: [
          '상대가 보낸 메시지에 서명이 붙어 있는지 확인하는 습관을 권합니다.',
          '서명이 없으면 같은 이름을 쓴 다른 사람일 수 있습니다.',
          '이 문서는 방법을 자세히 다루지 않습니다. 개념만 기억하세요.',
        ],
      },
    ],
  },
];
