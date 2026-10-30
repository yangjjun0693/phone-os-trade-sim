import { describe, expect, it } from 'vitest';
import {
  AMASON_CATEGORIES,
  AMASON_DELIVERY_MINUTES,
  AMASON_KRW_PER_USD,
  AMASON_PRODUCTS,
  amasonDeals,
  amasonDiscount,
  findAmasonProduct,
  usdToKrw,
} from './amason';

/**
 * The catalog is meant to be edited by hand, so these guard the shape an editor
 * can break without noticing: duplicate ids, a missing price, a category that
 * is not in the filter row, an image that is not a plain URL.
 */
describe('Amason catalog', () => {
  it('keeps the shop big enough to browse', () => {
    expect(AMASON_PRODUCTS.length).toBeGreaterThanOrEqual(8);
  });

  it('has unique ids', () => {
    const ids = AMASON_PRODUCTS.map((product) => product.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('prices every item in dollars and lists a sane rating', () => {
    for (const product of AMASON_PRODUCTS) {
      expect(product.price, product.id).toBeGreaterThan(0);
      expect(product.rating, product.id).toBeGreaterThanOrEqual(0);
      expect(product.rating, product.id).toBeLessThanOrEqual(5);
      expect(product.reviews, product.id).toBeGreaterThan(0);
      expect(product.bullets.length, product.id).toBeGreaterThan(0);
    }
  });

  it('only uses categories that exist in the filter row', () => {
    const allowed = new Set(AMASON_CATEGORIES.filter((option) => option !== 'All'));
    for (const product of AMASON_PRODUCTS) {
      expect(allowed.has(product.category), product.id).toBe(true);
    }
  });

  it('takes plain image URLs and nothing else', () => {
    for (const product of AMASON_PRODUCTS) {
      if (product.image === undefined) continue;
      expect(product.image, product.id).toMatch(/^https:\/\/.+/);
    }
  });

  it('finds a product by id', () => {
    expect(findAmasonProduct(AMASON_PRODUCTS[0].id)?.title).toBe(AMASON_PRODUCTS[0].title);
    expect(findAmasonProduct('nope')).toBeUndefined();
  });

  it('builds the deals rail from items that carry a list price', () => {
    const deals = amasonDeals();
    expect(deals.length).toBeGreaterThan(0);
    expect(deals.length).toBeLessThanOrEqual(6);
    for (const deal of deals) {
      expect(deal.listPrice).toBeGreaterThan(deal.price);
      expect(amasonDiscount(deal)).toBeGreaterThan(0);
    }
  });

  it('reports no discount when the price is not actually lower', () => {
    const [first] = AMASON_PRODUCTS;
    expect(amasonDiscount({ ...first, listPrice: undefined })).toBeNull();
    expect(amasonDiscount({ ...first, listPrice: first.price })).toBeNull();
  });

  it('converts dollars to the in-game won at a fixed rate', () => {
    expect(usdToKrw(1)).toBe(AMASON_KRW_PER_USD);
    expect(usdToKrw(12.99)).toBe(Math.round(12.99 * AMASON_KRW_PER_USD));
  });

  it('delivers inside a single in-game day', () => {
    expect(AMASON_DELIVERY_MINUTES).toBeGreaterThan(60);
    expect(AMASON_DELIVERY_MINUTES).toBeLessThanOrEqual(24 * 60);
  });
});
