// Small helpers for stock, safe to use in both server and browser code.
// A product's `stock` maps "size|color" to how many pieces are left.
// No `stock` at all (static fallback data) means "unlimited", so nothing is shown as sold out.

export type StockMap = Record<string, number>;

export const stockKey = (size: string, color: string) => size + '|' + color;

// How many pieces of this size + color can be bought (Infinity = no stock data).
export function stockOf(stock: StockMap | undefined, size: string, color: string): number {
  if (!stock) return Infinity;
  return stock[stockKey(size, color)] ?? 0;
}

// True when every size/color of the product has 0 pieces left.
export function isSoldOut(stock: StockMap | undefined): boolean {
  if (!stock) return false;
  return Object.values(stock).every((n) => n <= 0);
}
