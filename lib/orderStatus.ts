// Order statuses and the allowed moves between them. Pure data (no database), so the browser can use it too.

export const STATUSES = ['new', 'confirmed', 'shipped', 'delivered', 'canceled'] as const;
export type OrderStatus = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'جدید',
  confirmed: 'تأییدشده',
  shipped: 'ارسال‌شده',
  delivered: 'تحویل‌شده',
  canceled: 'لغوشده',
};

export const isStatus = (v: unknown): v is OrderStatus => typeof v === 'string' && (STATUSES as readonly string[]).includes(v);

// Allowed moves: one step forward, one step back (to fix a mistake), or cancel before delivery.
// "canceled" is final because canceling returns the pieces to stock.
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  new: ['confirmed', 'canceled'],
  confirmed: ['shipped', 'new', 'canceled'],
  shipped: ['delivered', 'confirmed', 'canceled'],
  delivered: ['shipped'],
  canceled: [],
};
export const allowedNext = (from: OrderStatus): OrderStatus[] => NEXT[from];
