/**
 * Amason catalog — 편집 방법 (this app is written in English on purpose: it is a
 * US storefront, so the shop, its copy and its prices are all American).
 *
 * 품목 추가는 아래 `AMASON_PRODUCTS` 배열에 객체 하나를 더하면 끝입니다.
 *
 *   {
 *     id: 'cable-usbc-2m',            // 고유 id (바꾸면 주문 기록과 어긋납니다)
 *     title: 'USB-C Cable, 2 m (2-Pack)',
 *     brand: 'Amason Basics',
 *     price: 12.99,                   // 미국 가격(달러). 게임 돈은 원화로 계산됩니다
 *     listPrice: 17.99,               // (선택) 정가 — 있으면 취소선 + 할인율 배지
 *     category: 'Electronics',        // AMASON_CATEGORIES 중 하나
 *     rating: 4.6,                    // 0~5
 *     reviews: 24_318,                // 리뷰 수
 *     badge: 'Best Seller',           // (선택) 카드에 붙는 짧은 라벨
 *     bullets: ['6 ft', '60 W'],      // 상세 페이지의 설명 줄
 *     image: 'https://.../photo.jpg', // (선택) 그냥 URL. 비우면 그림 타일이 뜹니다
 *   }
 *
 * 이미지: `image` 에 URL을 넣으면 그대로 뜹니다. 비워두면 카테고리별로 그려진
 * 타일이 대신 나오고, URL이 깨지거나 오프라인이어도 자동으로 타일로 돌아옵니다
 * (앱이 오프라인에서도 깨져 보이지 않게 하려는 장치입니다).
 *
 * 가격: 화면에는 달러로 크게, 원화로 작게 표시됩니다. `AMASON_KRW_PER_USD` 가
 * 둘의 환율이고, 실제로 차감되는 돈은 원화입니다.
 */
export const AMASON_KRW_PER_USD = 1350;

export const AMASON_CATEGORIES = [
  'All',
  'Electronics',
  'Home & Kitchen',
  'Outdoors',
  'Office',
  'Apparel',
  'Beauty',
] as const;

export type AmasonCategory = (typeof AMASON_CATEGORIES)[number];

export interface AmasonProduct {
  id: string;
  title: string;
  brand: string;
  /** 달러 가격. */
  price: number;
  /** 정가(달러). 있으면 취소선 + 할인율을 보여줍니다. */
  listPrice?: number;
  category: Exclude<AmasonCategory, 'All'>;
  rating: number;
  reviews: number;
  badge?: string;
  bullets: string[];
  /** 이미지 URL. 그냥 붙여넣으면 됩니다. 비우면 그림 타일이 대신 뜹니다. */
  image?: string;
}

export const AMASON_PRODUCTS: AmasonProduct[] = [
  {
    id: 'cable-usbc-2m',
    title: 'USB-C to USB-C Cable, 6 ft (2-Pack)',
    brand: 'Amason Basics',
    price: 12.99,
    listPrice: 18.99,
    category: 'Electronics',
    rating: 4.7,
    reviews: 128_402,
    badge: 'Best Seller',
    bullets: ['100 W fast charge', 'Braided nylon, 10,000-bend rated'],
  },
  {
    id: 'charger-gan-65w',
    title: '65 W GaN Wall Charger, 3-Port',
    brand: 'Amason Basics',
    price: 26.99,
    category: 'Electronics',
    rating: 4.6,
    reviews: 41_930,
    bullets: ['USB-C PD 3.0 + 2 × USB-A', 'Half the size of the stock brick'],
  },
  {
    id: 'headphones-anc',
    title: 'Wireless Noise-Cancelling Headphones, 40 h',
    brand: 'Sonorix',
    price: 79.99,
    listPrice: 119.99,
    category: 'Electronics',
    rating: 4.4,
    reviews: 18_640,
    badge: 'Limited time deal',
    bullets: ['Hybrid ANC with transparency mode', 'USB-C, folds flat'],
  },
  {
    id: 'webcam-1080p',
    title: '1080p Webcam with Ring Light and Mic',
    brand: 'Vistek',
    price: 33.49,
    category: 'Electronics',
    rating: 4.3,
    reviews: 9_215,
    bullets: ['Privacy shutter', 'Works with any call app'],
  },
  {
    id: 'kettle-pourover',
    title: 'Stainless Pour-Over Kettle, 1 L',
    brand: 'Northbrew',
    price: 29.95,
    category: 'Home & Kitchen',
    rating: 4.8,
    reviews: 63_120,
    badge: "Amason's Choice",
    bullets: ['Gooseneck spout', 'Built-in thermometer'],
  },
  {
    id: 'pan-ceramic-3pc',
    title: 'Ceramic Nonstick Frying Pan Set, 3-Piece',
    brand: 'Copperfield',
    price: 54.99,
    listPrice: 74.99,
    category: 'Home & Kitchen',
    rating: 4.5,
    reviews: 22_784,
    bullets: ['PFOA-free coating', 'Oven safe to 450 °F'],
  },
  {
    id: 'coffee-drip-12c',
    title: 'Programmable Drip Coffee Maker, 12-Cup',
    brand: 'Northbrew',
    price: 44.99,
    category: 'Home & Kitchen',
    rating: 4.4,
    reviews: 31_507,
    bullets: ['24 h programmable brew', 'Reusable filter included'],
  },
  {
    id: 'pack-40l',
    title: '40 L Waterproof Hiking Backpack',
    brand: 'Ridgeline',
    price: 46.8,
    category: 'Outdoors',
    rating: 4.6,
    reviews: 14_902,
    bullets: ['Rain cover included', 'Padded 15" laptop sleeve'],
  },
  {
    id: 'tent-2p',
    title: '2-Person Camping Tent, 3-Season',
    brand: 'Ridgeline',
    price: 68.0,
    listPrice: 89.0,
    category: 'Outdoors',
    rating: 4.2,
    reviews: 6_388,
    bullets: ['2-minute setup', 'Taped seams, 3000 mm'],
  },
  {
    id: 'bottle-32oz',
    title: 'Insulated Water Bottle, 32 oz (2-Pack)',
    brand: 'Northbrew',
    price: 21.99,
    category: 'Outdoors',
    rating: 4.7,
    reviews: 55_013,
    badge: 'Best Seller',
    bullets: ['Cold 24 h, hot 12 h', 'Fits standard cup holders'],
  },
  {
    id: 'keyboard-75',
    title: 'Mechanical Keyboard, 75% Hot-Swappable',
    brand: 'Keystone',
    price: 62.99,
    category: 'Office',
    rating: 4.5,
    reviews: 11_240,
    bullets: ['Gasket mount, lubed switches', 'USB-C detachable cable'],
  },
  {
    id: 'mouse-ergo',
    title: 'Wireless Ergonomic Mouse, Silent Click',
    brand: 'Vistek',
    price: 19.99,
    category: 'Office',
    rating: 4.3,
    reviews: 27_651,
    bullets: ['18-month battery', 'Tri-device pairing'],
  },
  {
    id: 'tshirt-crew-3pk',
    title: 'Cotton Crewneck T-Shirt, 3-Pack',
    brand: 'Amason Essentials',
    price: 18.99,
    category: 'Apparel',
    rating: 4.4,
    reviews: 88_970,
    bullets: ['100% combed cotton', '6 colours, S–3XL'],
  },
  {
    id: 'serum-vitc',
    title: 'Vitamin C Brightening Serum, 1 fl oz',
    brand: 'Lumen',
    price: 16.45,
    listPrice: 24.0,
    category: 'Beauty',
    rating: 4.6,
    reviews: 19_338,
    bullets: ['15% L-ascorbic acid', 'Fragrance-free'],
  },
];

/** 오늘의 특가 줄에 올릴 품목: 정가가 있는 것부터. */
export function amasonDeals(products: AmasonProduct[] = AMASON_PRODUCTS): AmasonProduct[] {
  return products.filter((product) => typeof product.listPrice === 'number').slice(0, 6);
}

export function findAmasonProduct(id: string): AmasonProduct | undefined {
  return AMASON_PRODUCTS.find((product) => product.id === id);
}

/** 달러 → 원화(게임 화폐). 주문 시 실제로 차감되는 금액입니다. */
export function usdToKrw(usd: number): number {
  return Math.round(usd * AMASON_KRW_PER_USD);
}

export function amasonDiscount(product: AmasonProduct): number | null {
  if (typeof product.listPrice !== 'number' || product.listPrice <= product.price) return null;
  return Math.round((1 - product.price / product.listPrice) * 100);
}

/**
 * 주문한 물건이 도착하기까지의 게임 시간(분). 게임 하루는 실시간 15분이라
 * "내일 도착"이 체감상 금방 오도록 하루 안쪽으로 잡았습니다.
 */
export const AMASON_DELIVERY_MINUTES = 8 * 60;
