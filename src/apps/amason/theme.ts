/**
 * Amason's own palette and price formatting.
 *
 * The storefront is American on purpose: labels are English and prices are
 * dollars. The won line only exists because the rest of the phone (wallet,
 * bank, cash) counts in won, so every price is shown both ways.
 */
export const AMASON_NAVY = '#232f3e';
export const AMASON_LINK = '#007185';
export const AMASON_YELLOW = '#ffd814';
export const AMASON_ORANGE = '#ffa41c';
export const AMASON_RED = '#b12704';

/** `12.99` -> `$12.99`. */
export function usd(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

/** The won side of a price, e.g. `≈ ₩17,550`. */
export function krwHint(value: number): string {
  return `≈ ${value.toLocaleString('en-US', { style: 'currency', currency: 'KRW' })}`;
}
