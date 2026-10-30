import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Check, Globe, Home, Package, Search, ShoppingCart, X } from 'lucide-react';
import {
  AMASON_CATEGORIES,
  AMASON_PRODUCTS,
  amasonDeals,
  amasonDiscount,
  type AmasonCategory,
  type AmasonProduct,
} from '@/content/amason';
import { cartCount, useAmasonStore, type AmasonOrder } from '@/store/amasonStore';
import { cn } from '@/utils/cn';
import { haptic } from '@/utils/haptics';
import { EASE_IOS, SPRING_SOFT } from '@/utils/motion';
import { CartView } from './CartView';
import { OrdersView } from './OrdersView';
import { ProductDetail } from './ProductDetail';
import { ProductThumb } from './ProductThumb';
import { Stars } from './parts';
import { AMASON_LINK, AMASON_NAVY, AMASON_RED, usd } from './theme';

type Tab = 'home' | 'orders' | 'cart';

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'orders', label: 'Your Orders', icon: Package },
  { id: 'cart', label: 'Cart', icon: ShoppingCart },
];

/**
 * Amason — the American storefront.
 *
 * Deliberately a US shop: the chrome is that navy-and-yellow that everyone
 * recognises, every label is English, and prices are dollars (the won line
 * underneath is only there because the rest of the phone counts in won).
 *
 * It is also deliberately harmless: buying a coffee maker spends cash and
 * nothing else. No heat, no stock, no parcels — see `store/amasonStore.ts`.
 */
export function AmasonApp() {
  const addToCart = useAmasonStore((s) => s.addToCart);
  const cart = useAmasonStore((s) => s.cart);

  const [tab, setTab] = useState<Tab>('home');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<AmasonCategory>('All');
  const [detail, setDetail] = useState<AmasonProduct | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const count = cartCount(cart);

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), 2200);
  };

  const openDetail = (product: AmasonProduct) => {
    haptic(5);
    setDetail(product);
  };

  const buyNow = (product: AmasonProduct, qty: number) => {
    addToCart(product.id, qty);
    setDetail(null);
    setTab('cart');
  };

  return (
    <div className="flex h-full flex-col bg-ios-bg text-ios-text">
      {/* Navy brand bar + search, straight from the US storefront. */}
      <header
        className="shrink-0 pt-[var(--ios-statusbar-h)] text-white"
        style={{ backgroundColor: AMASON_NAVY }}
      >
        <div className="flex items-center gap-2 px-3 pb-2 pt-1">
          <span className="text-[18px] font-bold tracking-tight">
            Amason<span style={{ color: '#ff9900' }}>.</span>
          </span>
          <span className="ml-auto flex items-center gap-1 text-[11px] font-medium text-white/70">
            <Globe className="size-3.5" aria-hidden />
            US
          </span>
          <button
            type="button"
            aria-label={count > 0 ? `Open cart, ${count} items` : 'Open cart'}
            onClick={() => {
              haptic(5);
              setTab('cart');
            }}
            className="relative flex size-9 items-center justify-center rounded-full active:bg-white/10"
          >
            <ShoppingCart className="size-5" aria-hidden />
            {count > 0 ? (
              <motion.span
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                transition={SPRING_SOFT}
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-[#0f1111]"
                style={{ backgroundColor: '#ff9900' }}
              >
                {count > 99 ? '99+' : count}
              </motion.span>
            ) : null}
          </button>
        </div>

        <div className="px-3 pb-3">
          <div className="flex h-10 items-center gap-2 rounded-full bg-white px-3 text-[#0f1111] ring-2 ring-[#ff9900]">
            <Search className="size-4 shrink-0 text-[#555]" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Amason"
              aria-label="Search Amason"
              className="h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#767676]"
            />
            {query ? (
              <button type="button" aria-label="Clear search" onClick={() => setQuery('')}>
                <X className="size-4 text-[#555]" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Department strip, only on the shop tab. */}
      {tab === 'home' ? (
        <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto border-b border-ios-separator/15 px-3 py-2">
          {AMASON_CATEGORIES.map((option) => {
            const active = option === category;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  haptic(4);
                  setCategory(option);
                }}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors',
                  active
                    ? 'text-white'
                    : 'bg-black/5 text-ios-text dark:bg-white/10',
                )}
                style={active ? { backgroundColor: AMASON_NAVY } : undefined}
              >
                {option}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="scroll-area no-scrollbar relative flex-1">
        {tab === 'home' ? (
          <ShopTab query={query} category={category} onOpen={openDetail} />
        ) : tab === 'orders' ? (
          <OrdersView onBrowse={() => setTab('home')} />
        ) : (
          <CartView
            onBrowse={() => setTab('home')}
            onPlaced={(order: AmasonOrder) => {
              setTab('orders');
              flash(
                `Order placed · arriving ${format(new Date(order.etaAt), 'EEE, MMM d', { locale: enUS })}`,
              );
            }}
          />
        )}
      </div>

      {/* Bottom tabs, the way the real app does it. */}
      <nav className="flex shrink-0 items-stretch border-t border-ios-separator/15 bg-ios-bg pb-[max(env(safe-area-inset-bottom,0px),4px)]">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = id === tab;
          return (
            <button
              key={id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => {
                haptic(4);
                setTab(id);
              }}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold',
                active ? 'text-ios-text' : 'text-ios-muted',
              )}
              style={active ? { color: AMASON_LINK } : undefined}
            >
              <Icon className="size-5" aria-hidden />
              {label}
              {id === 'cart' && count > 0 ? (
                <span
                  aria-hidden
                  className="absolute right-[22%] top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-[#0f1111]"
                  style={{ backgroundColor: '#ff9900' }}
                >
                  {count > 99 ? '99+' : count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <AnimatePresence>
        {detail ? (
          <ProductDetail
            key={detail.id}
            product={detail}
            onClose={() => setDetail(null)}
            onAdded={() => flash('Added to Cart')}
            onBuyNow={buyNow}
          />
        ) : null}
      </AnimatePresence>

      {/* "Added to Cart" confirmation, above the tabs. */}
      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: EASE_IOS }}
            className="pointer-events-none absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom,0px)+74px)] z-50 flex items-center gap-2 rounded-full bg-[#0f1111] px-3.5 py-2 text-[12px] font-semibold text-white shadow-xl"
            role="status"
          >
            <Check className="size-4 text-[#ffd814]" aria-hidden />
            <span className="truncate">{toast}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Deals rail + the recommendation grid, or search results when filtering. */
function ShopTab({
  query,
  category,
  onOpen,
}: {
  query: string;
  category: AmasonCategory;
  onOpen: (product: AmasonProduct) => void;
}) {
  const trimmed = query.trim().toLowerCase();

  const results = useMemo(
    () =>
      AMASON_PRODUCTS.filter((product) => {
        if (category !== 'All' && product.category !== category) return false;
        if (!trimmed) return true;
        return `${product.title} ${product.brand} ${product.category}`.toLowerCase().includes(trimmed);
      }),
    [trimmed, category],
  );

  const filtering = trimmed.length > 0 || category !== 'All';
  const deals = useMemo(() => amasonDeals(), []);

  if (filtering) {
    return (
      <div className="px-4 pb-6 pt-3">
        <p className="text-[12px] text-ios-muted">
          {results.length} {results.length === 1 ? 'result' : 'results'}
          {trimmed ? ` for “${query.trim()}”` : ''}
          {category !== 'All' ? ` in ${category}` : ''}
        </p>
        {results.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <p className="text-[15px] font-semibold">No results for that search</p>
            <p className="text-[13px] text-ios-muted">
              Try “cable”, “coffee”, “tent” — or browse a department.
            </p>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} onOpen={onOpen} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-6 pt-3">
      <div className="flex items-baseline justify-between px-4">
        <h2 className="text-[17px] font-bold text-[#0f1111] dark:text-ios-text">Today's Deals</h2>
        <span className="text-[11px] font-medium" style={{ color: AMASON_LINK }}>
          Free on Prime
        </span>
      </div>
      <div className="no-scrollbar mt-2 flex gap-3 overflow-x-auto px-4 pb-1">
        {deals.map((product) => {
          const discount = amasonDiscount(product);
          return (
            <motion.button
              key={product.id}
              type="button"
              aria-label={product.title}
              whileTap={{ scale: 0.97 }}
              onClick={() => onOpen(product)}
              className="w-[142px] shrink-0 overflow-hidden rounded-2xl bg-ios-surface text-left ring-1 ring-black/5 dark:ring-white/5"
            >
              <div className="relative aspect-square w-full overflow-hidden">
                <ProductThumb product={product} />
                {discount ? (
                  <span
                    className="absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[11px] font-bold text-white"
                    style={{ backgroundColor: AMASON_RED }}
                  >
                    -{discount}%
                  </span>
                ) : null}
              </div>
              <div className="p-2">
                <p className="line-clamp-2 text-[12px] font-medium leading-snug">{product.title}</p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-[14px] font-bold tabular-nums text-[#b12704] dark:text-[#ff9b7a]">
                    {usd(product.price)}
                  </span>
                  {product.listPrice ? (
                    <span className="text-[11px] text-ios-muted line-through tabular-nums">
                      {usd(product.listPrice)}
                    </span>
                  ) : null}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <h2 className="mt-4 px-4 text-[17px] font-bold text-[#0f1111] dark:text-ios-text">
        Top picks for you
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 px-4">
        {AMASON_PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function ProductCard({
  product,
  onOpen,
}: {
  product: AmasonProduct;
  onOpen: (product: AmasonProduct) => void;
}) {
  const discount = amasonDiscount(product);
  return (
    <motion.button
      type="button"
      aria-label={product.title}
      whileTap={{ scale: 0.97 }}
      onClick={() => onOpen(product)}
      className="flex flex-col overflow-hidden rounded-2xl bg-ios-surface text-left ring-1 ring-black/5 dark:ring-white/5"
    >
      <div className="relative aspect-square w-full overflow-hidden">
        <ProductThumb product={product} />
        {discount ? (
          <span
            className="absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[11px] font-bold text-white"
            style={{ backgroundColor: AMASON_RED }}
          >
            -{discount}%
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-2">
        {product.badge ? (
          <span className="mb-1 w-fit rounded bg-[#ff9900]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#8a5a00] dark:text-[#ffc46b]">
            {product.badge}
          </span>
        ) : null}
        <p className="line-clamp-2 text-[12px] font-medium leading-snug">{product.title}</p>
        <div className="mt-1 flex items-center gap-1">
          <Stars rating={product.rating} />
          <span className="text-[10px] text-ios-muted">{product.reviews.toLocaleString('en-US')}</span>
        </div>
        <div className="mt-auto pt-1.5">
          <span className="text-[15px] font-bold tabular-nums text-[#b12704] dark:text-[#ff9b7a]">
            {usd(product.price)}
          </span>
          <p className="text-[10px] font-medium text-ios-green">FREE delivery</p>
        </div>
      </div>
    </motion.button>
  );
}
