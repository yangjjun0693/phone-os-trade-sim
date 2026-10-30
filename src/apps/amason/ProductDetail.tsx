import { useState } from 'react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, RotateCw, ShieldCheck, Truck } from 'lucide-react';
import {
  AMASON_DELIVERY_MINUTES,
  amasonDiscount,
  usdToKrw,
  type AmasonProduct,
} from '@/content/amason';
import { useGameStore } from '@/store/gameStore';
import { useAmasonStore } from '@/store/amasonStore';
import { cn } from '@/utils/cn';
import { haptic } from '@/utils/haptics';
import { EASE_IOS } from '@/utils/motion';
import { CtaButton, Stars } from './parts';
import { ProductThumb } from './ProductThumb';
import { AMASON_LINK, AMASON_NAVY, AMASON_RED, krwHint, usd } from './theme';

/** A listing page, with Amazon's own button pair and a delivery date that follows the game clock. */
export function ProductDetail({
  product,
  onClose,
  onAdded,
  onBuyNow,
}: {
  product: AmasonProduct;
  onClose: () => void;
  onAdded: () => void;
  onBuyNow: (product: AmasonProduct, qty: number) => void;
}) {
  const gameDateTime = useGameStore((s) => s.gameDateTime);
  const addToCart = useAmasonStore((s) => s.addToCart);
  const [qty, setQty] = useState(1);

  const discount = amasonDiscount(product);
  const eta = new Date(new Date(gameDateTime).getTime() + AMASON_DELIVERY_MINUTES * 60_000);

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.24, ease: EASE_IOS }}
      className="absolute inset-0 z-40 flex flex-col bg-ios-bg"
      role="dialog"
      aria-label={product.title}
    >
      {/* The brand bar stays navy on a listing too, so the white status bar ink
          the OS picked for this app is right on this screen as well. */}
      <div
        className="flex shrink-0 items-center gap-2 px-2 pb-2.5 pt-[calc(var(--ios-statusbar-h)+4px)] text-white"
        style={{ backgroundColor: AMASON_NAVY }}
      >
        <button
          type="button"
          aria-label="Back"
          onClick={onClose}
          className="flex size-9 items-center justify-center rounded-full active:bg-white/10"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <span className="truncate text-[15px] font-semibold text-white/90">{product.brand}</span>
      </div>

      <div className="scroll-area no-scrollbar flex-1 pb-32">
        <div className="aspect-square w-full overflow-hidden bg-white">
          <ProductThumb product={product} />
        </div>

        <div className="px-4 pt-4">
          <h1 className="text-[19px] font-semibold leading-snug text-[#0f1111] dark:text-ios-text">
            {product.title}
          </h1>

          <div className="mt-1.5 flex items-center gap-1.5">
            <Stars rating={product.rating} />
            <span className="text-[12px] font-medium" style={{ color: AMASON_LINK }}>
              {product.rating.toFixed(1)}
            </span>
            <span className="text-[12px] text-ios-muted">
              ({product.reviews.toLocaleString('en-US')})
            </span>
          </div>

          <div className="mt-3 flex items-end gap-2 border-t border-ios-separator/15 pt-3">
            {discount ? (
              <span
                className="mb-0.5 rounded px-1.5 py-0.5 text-[12px] font-bold text-white"
                style={{ backgroundColor: AMASON_RED }}
              >
                -{discount}%
              </span>
            ) : null}
            <span className="text-[26px] font-bold leading-none tabular-nums text-[#b12704] dark:text-[#ff9b7a]">
              {usd(product.price)}
            </span>
            {product.listPrice ? (
              <span className="text-[12px] text-ios-muted line-through tabular-nums">
                {usd(product.listPrice)}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[11px] text-ios-muted tabular-nums">
            {krwHint(usdToKrw(product.price))} charged from your cash
          </p>

          <p className="mt-3 text-[13px] leading-relaxed text-ios-muted">{product.bullets.join(' · ')}</p>

          <div className="mt-4 space-y-2 border-t border-ios-separator/15 pt-3 text-[12px]">
            <p className="flex items-center gap-2 font-semibold text-ios-green">
              <Truck className="size-4" aria-hidden />
              FREE delivery {format(eta, 'EEE, MMM d', { locale: enUS })}
            </p>
            <p className="flex items-center gap-2 text-ios-muted">
              <RotateCw className="size-4" aria-hidden />
              30-day returns, no questions asked
            </p>
            <p className="flex items-center gap-2 text-ios-muted">
              <ShieldCheck className="size-4" aria-hidden />
              Amason Prime · free on every order
            </p>
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-ios-separator/15 pt-3">
            <span className="text-[13px] font-medium">Quantity</span>
            <div className="flex items-center rounded-full bg-black/5 dark:bg-white/10">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => {
                  haptic(4);
                  setQty((value) => Math.max(1, value - 1));
                }}
                className="flex size-8 items-center justify-center rounded-full"
              >
                <Minus className="size-4" aria-hidden />
              </button>
              <span className="w-7 text-center text-[14px] font-semibold tabular-nums">{qty}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => {
                  haptic(4);
                  setQty((value) => Math.min(99, value + 1));
                }}
                className="flex size-8 items-center justify-center rounded-full"
              >
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-strong absolute inset-x-0 bottom-0 flex gap-2 px-4 pb-[max(env(safe-area-inset-bottom,0px),14px)] pt-3">
        <CtaButton
          onClick={() => {
            haptic(8);
            addToCart(product.id, qty);
            onAdded();
          }}
          className={cn('flex-1')}
        >
          Add to Cart
        </CtaButton>
        <CtaButton
          tone="orange"
          onClick={() => {
            haptic(10);
            onBuyNow(product, qty);
          }}
          className="flex-1"
        >
          Buy Now
        </CtaButton>
      </div>
    </motion.div>
  );
}
