import { formatPrice } from '@/lib/format';
import { site } from '@/lib/site';

// The texts customers receive. Edit the wording here; nothing else needs to change.
// Keep them short: a long text is split into several SMS parts and costs more.
// The tracking link carries only the order code, never the mobile number.
export function orderPlacedText(p: { code: string; total: number; origin: string }): string {
  return [
    site.name + ': سفارش شما ثبت شد.',
    'کد پیگیری: ' + p.code,
    'مبلغ کل: ' + formatPrice(p.total),
    'پیگیری سفارش: ' + p.origin + '/track?code=' + p.code,
  ].join('\n');
}
