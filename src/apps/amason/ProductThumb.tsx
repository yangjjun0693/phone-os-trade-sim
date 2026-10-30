import { useState } from 'react';
import {
  Backpack,
  Coffee,
  Headphones,
  Keyboard,
  Package,
  Shirt,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { AmasonProduct } from '@/content/amason';
import { cn } from '@/utils/cn';

/**
 * Product art. A listing may carry a plain image URL; if it does not — or the
 * URL fails, which is what happens offline — a tile drawn from the category
 * takes over, so a listing never shows a broken image.
 */
const CATEGORY_ART: Record<AmasonProduct['category'], { icon: LucideIcon; from: string; to: string }> = {
  Electronics: { icon: Headphones, from: '#dbeafe', to: '#c3dafe' },
  'Home & Kitchen': { icon: Coffee, from: '#ffedd5', to: '#fed7aa' },
  Outdoors: { icon: Backpack, from: '#dcfce7', to: '#b9f0c8' },
  Office: { icon: Keyboard, from: '#e0e7ff', to: '#c7d2fe' },
  Apparel: { icon: Shirt, from: '#fce7f3', to: '#fbcfe8' },
  Beauty: { icon: Sparkles, from: '#f3e8ff', to: '#e9d5ff' },
};

export function ProductThumb({
  product,
  className,
  iconClassName,
}: {
  product: AmasonProduct;
  className?: string;
  iconClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const art = CATEGORY_ART[product.category] ?? { icon: Package, from: '#eef2f7', to: '#dde5ee' };
  const Icon = art.icon;

  if (product.image && !failed) {
    return (
      <img
        src={product.image}
        alt={product.title}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={cn('h-full w-full bg-white object-contain', className)}
      />
    );
  }

  return (
    <div
      className={cn('flex h-full w-full items-center justify-center', className)}
      style={{ backgroundImage: `linear-gradient(150deg, ${art.from}, ${art.to})` }}
      aria-hidden
    >
      <Icon className={cn('size-1/2 text-slate-700/60', iconClassName)} strokeWidth={1.3} />
    </div>
  );
}
