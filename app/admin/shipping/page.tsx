import Link from 'next/link';
import ShippingSettingsForm, { type ShippingFormData } from '@/components/admin/ShippingSettingsForm';
import { hasDb } from '@/lib/db';
import { BANDS_G, CARRIER_IDS, CARRIER_LABELS, getShippingSettings } from '@/lib/shipping';

export const dynamic = 'force-dynamic';

export default async function AdminShippingPage() {
  const dbOk = hasDb();
  const s = await getShippingSettings();
  const data: ShippingFormData = {
    carrier: s.carrier,
    packagingG: s.packagingG,
    carriers: CARRIER_IDS.map((id) => ({ id, label: CARRIER_LABELS[id] })),
    bandsG: BANDS_G,
    rates: s.rates,
  };

  return (
    <div>
      <Link href='/admin' className='text-sm text-ink/60'>→ پنل مدیریت</Link>
      <h1 className='mt-2 text-xl font-bold'>هزینهٔ ارسال</h1>
      <p className='mt-1 text-xs text-ink/50'>
        هزینه به استان مشتری و وزن سفارش بستگی دارد. ارسال از نیشابور (خراسان رضوی) است و بالای ۲٬۰۰۰٬۰۰۰ تومان رایگان می‌ماند.
      </p>
      {!dbOk ? (
        <p className='mt-6 text-sm text-ink/60'>دیتابیس وصل نیست؛ تنظیمات ذخیره نمی‌شود.</p>
      ) : (
        <ShippingSettingsForm data={data} />
      )}
    </div>
  );
}
