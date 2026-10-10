import { notFound } from 'next/navigation';
import PrintButton from '@/components/admin/PrintButton';
import { formatDateTime } from '@/lib/adminDate';
import { getOrder } from '@/lib/adminOrders';
import { hasDb } from '@/lib/db';
import { formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';

// Packing slip: plain black-on-white page meant for printing (the buttons disappear on paper).
export default async function PackingSlipPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!hasDb() || !Number.isInteger(id) || id <= 0) notFound();
  const o = await getOrder(id);
  if (!o) notFound();
  const fa = (n: number) => new Intl.NumberFormat('fa-IR').format(n);

  return (
    <div className='slip rounded-2xl bg-white p-5 text-black'>
      <style>{`@media print { .no-print { display: none !important; } .slip { padding: 0; border-radius: 0; } body { background: #fff !important; } }`}</style>
      <div className='no-print mb-4 flex items-center justify-between'>
        <a href={'/admin/orders/' + o.id} className='text-sm text-brand'>← بازگشت</a>
        <PrintButton />
      </div>

      <div className='flex items-start justify-between gap-3 border-b border-black/30 pb-3'>
        <div>
          <p className='text-lg font-bold'>ماه‌پری</p>
          <p className='text-xs'>برگهٔ بسته‌بندی</p>
        </div>
        <div className='text-end'>
          <p className='font-bold' dir='ltr'>{o.code}</p>
          <p className='text-xs'>{formatDateTime(o.createdAt)}</p>
        </div>
      </div>

      <div className='mt-3 text-sm'>
        <p className='font-bold'>{o.customerName} — <span dir='ltr'>{o.mobile}</span></p>
        <p className='mt-1'>{o.city}{o.postalCode ? ' — کدپستی ' : ''}{o.postalCode && <span dir='ltr'>{o.postalCode}</span>}</p>
        <p className='mt-1 whitespace-pre-line'>{o.address}</p>
        {o.note && <p className='mt-2 border border-black/30 p-2'>توضیح مشتری: {o.note}</p>}
      </div>

      <table className='mt-4 w-full border-collapse text-sm'>
        <thead>
          <tr className='border-y border-black/40 text-start'>
            <th className='py-1.5 text-start'>کالا</th>
            <th className='py-1.5 text-start'>سایز</th>
            <th className='py-1.5 text-start'>رنگ</th>
            <th className='py-1.5 text-center'>تعداد</th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((i, n) => (
            <tr key={n} className='border-b border-black/15 align-top'>
              <td className='py-2 pe-2'>☐ {i.title}</td>
              <td className='py-2' dir='ltr'>{i.size}</td>
              <td className='py-2'>{i.color}</td>
              <td className='py-2 text-center font-bold'>{fa(i.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className='mt-3 space-y-1 text-sm'>
        <div className='flex justify-between'><span>جمع کالاها</span><span>{formatPrice(o.subtotal)}</span></div>
        <div className='flex justify-between'><span>هزینهٔ ارسال</span><span>{o.shipping === 0 ? 'رایگان' : formatPrice(o.shipping)}</span></div>
        <div className='flex justify-between border-t border-black/40 pt-1 font-bold'><span>مبلغ نهایی</span><span>{formatPrice(o.total)}</span></div>
      </div>
      <p className='mt-6 text-center text-xs'>از خرید شما سپاسگزاریم 🌙</p>
    </div>
  );
}
