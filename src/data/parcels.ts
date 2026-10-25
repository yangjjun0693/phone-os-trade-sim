import type { Parcel } from '@/game/parcels';

const STAGES = [
  { label: '접수 완료', atHours: 0 },
  { label: '집하', atHours: 6 },
  { label: '간선 이동', atHours: 20 },
  { label: '배송 출발', atHours: 34 },
  { label: '배송 완료', atHours: 38 },
];

/** Seeds are relative to the game epoch (2026-03-14 21:47 UTC). */
export const PARCELS: Parcel[] = [
  {
    id: 'p-1',
    label: '생활용품 세트',
    sender: '모아마트',
    trackingNo: 'BD 4821 7730 19',
    orderedAt: '2026-03-11T06:00:00.000Z',
    stages: STAGES,
  },
  {
    id: 'p-2',
    label: '소형 전자기기 부품',
    sender: '해외직구 스토어',
    trackingNo: 'BD 9012 3345 62',
    orderedAt: '2026-03-14T04:00:00.000Z',
    stages: [
      { label: '접수 완료', atHours: 0 },
      { label: '집하', atHours: 5 },
      { label: '간선 이동', atHours: 16 },
      { label: '배송 출발', atHours: 30 },
      { label: '배송 완료', atHours: 34 },
    ],
  },
  {
    id: 'p-3',
    label: '의류 (교환 상품)',
    sender: '가온패션',
    trackingNo: 'BD 7765 2208 41',
    orderedAt: '2026-03-13T00:00:00.000Z',
    stages: STAGES,
    delayHours: 30,
  },
  {
    id: 'p-4',
    label: '서류 봉투',
    sender: '발신인 미표기',
    trackingNo: 'BD 1190 6054 77',
    orderedAt: '2026-03-12T10:00:00.000Z',
    stages: STAGES,
    holdAtStage: 2,
  },
];
