/**
 * 공급자(벤더) — "내가 사는 거래자"
 *
 * 편집 방법
 *  - 여기 등록한 사람은 메신저로 **먼저 연락을 걸어옵니다**. 대화에서 주문하면
 *    현금이 빠지고 물량이 배송(구팡)으로 들어옵니다.
 *  - `minTrust`: 이 신뢰 미만이면 거래를 거절합니다. (스페셜 품목일수록 높음)
 *  - `special: true` 품목은 화면에서 "스페셜"로 표시됩니다.
 *  - `qty` 는 한 번에 넘어오는 묶음 수량입니다. (스페셜은 대량 묶음)
 */
import type { Product } from '@/types';

export interface VendorOffer {
  productId: string;
  /** 공급자가 부르는 개당 가격. */
  unitPrice: number;
  /** 한 번에 넘어오는 수량. */
  qty: number;
  /** 이 신뢰 미만이면 거절. */
  minTrust: number;
  /** 협상(값 깎기) 성공 시 적용할 배수. */
  haggleFactor?: number;
  note: string;
}

export interface Vendor {
  npcId: string;
  /** 대화 시작 문구. */
  opener: string;
  /** 이 사람이 파는 것들. */
  offers: VendorOffer[];
}

export const VENDORS: Vendor[] = [
  {
    npcId: 'npc-vendor-mnl',
    opener: '마닐라에서 직송한다. 좋은 물건 있고, 값은 여기서 정한다.',
    offers: [
      {
        productId: 'product-special-ph',
        unitPrice: 320_000,
        qty: 1,
        minTrust: 20,
        haggleFactor: 0.92,
        note: '10g 직송 패키지 · 통관 위험 큼',
      },
      {
        productId: 'product-special-crystal',
        unitPrice: 480_000,
        qty: 1,
        minTrust: 45,
        note: '고순도 결정 · 선입금만',
      },
    ],
  },
  {
    npcId: 'npc-vendor-hk',
    opener: '홍콩 쪽에서 넘어온 물량이 있다. 필요하면 말해라.',
    offers: [
      {
        productId: 'product-special-kit',
        unitPrice: 380_000,
        qty: 1,
        minTrust: 30,
        haggleFactor: 0.9,
        note: '혼합 세트 · 소량 분할 판매용',
      },
      {
        productId: 'product-meth',
        unitPrice: 38_000,
        qty: 6,
        minTrust: 10,
        note: '국내 물량 · 묶음 6개',
      },
    ],
  },
  {
    npcId: 'npc-vendor-cai',
    opener: '카이로 쪽 중개인이다. 스페셜만 취급한다.',
    offers: [
      {
        productId: 'product-special-ph',
        unitPrice: 300_000,
        qty: 2,
        minTrust: 60,
        haggleFactor: 0.88,
        note: '2묶음 동시 · 최저가, 대신 위험',
      },
    ],
  },
];

export function findVendor(npcId: string): Vendor | undefined {
  return VENDORS.find((vendor) => vendor.npcId === npcId);
}

/** Special goods get a badge and only show up through a vendor. */
export function isSpecialProduct(product: Pick<Product, 'tier'>): boolean {
  return product.tier === 'special';
}
