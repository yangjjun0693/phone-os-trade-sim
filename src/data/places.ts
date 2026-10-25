import type { Place, PlaceKind } from '@/types';

export type { Place, PlaceKind };

export const MAP_W = 400;
export const MAP_H = 560;

export const PLACES: Place[] = [
  { id: 'home', name: '내 집', kind: 'home', x: 292, y: 118, base: 0.6, note: '새벽구 원룸 단지. 조용하지만 야간 순찰이 가끔 돈다.' },
  { id: 'store', name: '24시 편의점', kind: 'shop', x: 120, y: 92, base: 1.2, nightlife: true, note: '밤에도 불이 켜져 있어 사람 눈이 많다.' },
  { id: 'underground', name: '지하상가 입구', kind: 'market', x: 160, y: 205, base: 1.8, nightlife: true, note: '유동 인구가 많고 CCTV가 곳곳에 있다.' },
  { id: 'police', name: '하늘 파출소', kind: 'police', x: 62, y: 150, base: 3, note: '관할 파출소. 주변은 순찰이 항상 잦다.' },
  { id: 'park', name: '가온 중앙공원', kind: 'park', x: 92, y: 360, base: 0.8, note: '낮에는 붐비지만 밤에는 한적하다.' },
  { id: 'terminal', name: '시외버스터미널', kind: 'transit', x: 150, y: 468, base: 1.7, nightlife: true, note: '막차 시간대에 사람이 몰리고 검문이 잦다.' },
  { id: 'port', name: '항만 창고 구역', kind: 'port', x: 316, y: 430, base: 0.7, note: '낮에는 화물차가 다니고 밤에는 인적이 드물다.' },
  { id: 'bridge', name: '달빛교 아래', kind: 'park', x: 250, y: 300, base: 0.5, note: '강변 산책로. 조명이 어두운 구간이 있다.' },
];

export const KIND_LABEL: Record<PlaceKind, string> = {
  home: '주거',
  shop: '상점',
  park: '공원',
  transit: '교통',
  market: '상가',
  port: '항만',
  police: '경찰',
};
