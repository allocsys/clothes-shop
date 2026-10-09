import { site } from '@/lib/site';

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('fa-IR').format(value) + ' ' + site.currency;
}
