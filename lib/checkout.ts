// TODO: set your real shipping rules. Promo bar says free shipping above 2,000,000 Toman.
export const FREE_SHIPPING_FROM = 2_000_000;
export const SHIPPING_FEE = 90_000;

// Persian/Arabic digits -> English digits (for phone numbers typed on a Persian keyboard)
export function toEnglishDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

export function normalizePhone(input: string): string {
  return toEnglishDigits(input).replace(/[\s-]/g, '');
}

export function isValidIranMobile(input: string): boolean {
  return /^09\d{9}$/.test(normalizePhone(input));
}

export type OrderItem = { slug: string; size: string; color: string; qty: number };

// Totals are always computed from our own product data, never from client-sent prices
export function priceOrder(items: OrderItem[], products: { slug: string; price: number }[]) {
  let subtotal = 0;
  for (const it of items) {
    const p = products.find((x) => x.slug === it.slug);
    if (p) subtotal += p.price * it.qty;
  }
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
  return { subtotal, shipping, total: subtotal + shipping };
}
