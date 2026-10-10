// Payment state next to the order status. Nothing is shown for orders that never tried online payment.
export default function PaymentBadge({ paid, attempts, needsRefund }: { paid: boolean; attempts: number; needsRefund: boolean }) {
  if (needsRefund) return <span className='shrink-0 rounded-full bg-rose px-2.5 py-0.5 text-xs font-bold text-white'>نیاز به بازپرداخت</span>;
  if (paid) return <span className='shrink-0 rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-bold text-brand'>پرداخت‌شده</span>;
  if (attempts > 0) return <span className='shrink-0 rounded-full bg-ink/10 px-2.5 py-0.5 text-xs font-bold text-ink/70'>پرداخت‌نشده</span>;
  return null;
}
