import Link from 'next/link';
import SiteSettingsForm, { type SiteFormData } from '@/components/admin/SiteSettingsForm';
import { hasDb } from '@/lib/db';
import { SOCIALS, getSiteSettings } from '@/lib/siteSettings';

export const dynamic = 'force-dynamic';

export default async function AdminSitePage() {
  const s = await getSiteSettings();
  const data: SiteFormData = {
    promo: s.promo,
    phone: s.phone,
    address: s.address,
    socials: SOCIALS.map((x) => ({ id: x.id, label: x.label, value: s.socials[x.id] })),
  };

  return (
    <div>
      <Link href='/admin' className='text-sm text-ink/60'>→ پنل مدیریت</Link>
      <h1 className='mt-2 text-xl font-bold'>متن و تماس فروشگاه</h1>
      <p className='mt-1 text-xs text-ink/50'>
        نوار بالای سایت، شماره تماس، آدرس و لینک شبکه‌های اجتماعی. هر چیزی که خالی بماند در سایت نمایش داده نمی‌شود.
      </p>
      {!hasDb() ? (
        <p className='mt-6 text-sm text-ink/60'>دیتابیس وصل نیست؛ تنظیمات ذخیره نمی‌شود.</p>
      ) : (
        <SiteSettingsForm data={data} />
      )}
    </div>
  );
}
