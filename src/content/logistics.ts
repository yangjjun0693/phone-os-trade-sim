/**
 * 물류 설정 — 편집 방법
 *
 *  - 수령 주소 3곳의 비용/위험/소요 시간을 여기서 조절합니다.
 *  - fee: 주문할 때 내는 배송·보관료
 *  - heat: **도착했을 때** 오르는 heat (집이 알려질수록 위험)
 *  - seizeChance: 도착 시 압수될 확률 (게임 난이도 조절용)
 *  - loseChance: 도착 시 분실될 확률 (드롭 전용)
 *  - hours: 주문부터 도착까지 걸리는 게임 시간
 */

export type DropAddress = 'home' | 'storage' | 'drop';

export interface AddressOption {
  id: DropAddress;
  label: string;
  hint: string;
  fee: number;
  heat: number;
  seizeChance: number;
  loseChance: number;
  hours: number;
}

export const ADDRESSES: AddressOption[] = [
  {
    id: 'home',
    label: '내 집',
    hint: '무료 · 수령이 빠르지만 집이 알려진다',
    fee: 0,
    heat: 4,
    seizeChance: 0.05,
    loseChance: 0,
    hours: 8,
  },
  {
    id: 'storage',
    label: '항만 창고',
    hint: '보관료 ₩30,000 · 가장 안전하다',
    fee: 30_000,
    heat: 1,
    seizeChance: 0.02,
    loseChance: 0,
    hours: 12,
  },
  {
    id: 'drop',
    label: '공원 드롭',
    hint: '무료 · 흔적이 없지만 잃어버릴 수 있다',
    fee: 0,
    heat: 0,
    seizeChance: 0.03,
    loseChance: 0.15,
    hours: 10,
  },
];

export function findAddress(id: DropAddress): AddressOption {
  return ADDRESSES.find((address) => address.id === id) ?? ADDRESSES[0];
}

export const DEFAULT_ADDRESS: DropAddress = 'drop';
