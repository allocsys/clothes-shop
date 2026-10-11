'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export type SiteFormData = {
  promo: string;
  phone: string;
  address: string;
  socials: { id: string; label: string; value: string }[];
};

const FIELD = 'w-full rounded-2xl border border-ink/15 bg-surface px-4 py-3 outline-none focus:border-brand';

export default function SiteSettingsForm({ data }: { data: SiteFormData }) {
  const router = useRouter();
  const initialSocials = Object.fromEntries(data.socials.map((s) => [s.id, s.value])) as Record<string, string>;

  const [promo, setPromo] = useState(data.promo);
  const [phone, setPhone] = useState(data.phone);
  const [address, setAddress] = useState(data.address);
  const [socials, setSocials] = useState<Record<string, string>>(initialSocials);
  const snapshot = (a: string, b: string, c: string, d: Record<string, string>) => JSON.stringify([a, b, c, d]);
  const [saved, setSaved] = useState(() => snapshot(data.promo, data.phone, data.address, initialSocials));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const dirty = snapshot(promo, phone, address, socials) !== saved;

  function labelOf(field: string): string {
    if (field === 'promo') return 'متن نوار بالای سایت';
    if (field === 'phone') return 'شماره تماس';
    if (field === 'address') return 'آدرس';
    return data.socials.find((s) => s.id === field)?.label ?? field;
  }

  function serverText(error: string, field?: string): string {
    if (error === 'bad_input' && field) {
      if (field === 'phone') return 'شماره تماس درست نیست. فقط عدد، فاصله و + یا - بنویسید (حداقل ۵ رقم).';
      if (data.socials.some((s) => s.id === field)) return `«${labelOf(field)}» درست نیست. نام کاربری (مثل mahpari@) یا آدرس کامل با https:// بنویسید.`;
      return `«${labelOf(field)}» درست نیست یا بیش از حد طولانی است.`;
    }
    if (error === 'no_database') return 'دیتابیس وصل نیست؛ ذخیره نشد.';
    return 'ذخیره نشد. دوباره تلاش کنید.';
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || !dirty) return;
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch('/api/admin/site', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promo, phone, address, socials }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.settings) {
        // show what was really saved (digits and links are cleaned on the server)
        const s = body.settings;
        setPromo(s.promo);
        setPhone(s.phone);
        setAddress(s.address);
        setSocials(s.socials);
        setSaved(snapshot(s.promo, s.phone, s.address, s.socials));
        setMessage({ ok: true, text: 'ذخیره شد. همین حالا در سایت دیده می‌شود.' });
        router.refresh();
      } else if (res.status === 401) {
        setMessage({ ok: false, text: 'نشست شما تمام شده است. دوباره وارد شوید.' });
        router.replace('/admin/login');
      } else {
        setMessage({ ok: false, text: serverText(String(body.error ?? ''), body.field) });
      }
    } catch {
      setMessage({ ok: false, text: 'ارتباط با سرور برقرار نشد. دوباره تلاش کنید.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className='mt-5 space-y-5'>
      <div>
        <label htmlFor='st-promo' className='mb-1 block text-sm font-bold'>متن نوار بالای سایت</label>
        <input id='st-promo' value={promo} maxLength={120} onChange={(e) => setPromo(e.target.value)} className={FIELD} />
        <p className='mt-1 text-xs text-ink/60'>خالی بگذارید تا نوار نمایش داده نشود.</p>
      </div>

      <div>
        <label htmlFor='st-phone' className='mb-1 block text-sm font-bold'>شماره تماس</label>
        <input id='st-phone' type='tel' inputMode='tel' dir='ltr' value={phone} maxLength={30} onChange={(e) => setPhone(e.target.value)} className={FIELD + ' text-left'} />
      </div>

      <div>
        <label htmlFor='st-address' className='mb-1 block text-sm font-bold'>آدرس فروشگاه</label>
        <textarea id='st-address' rows={3} value={address} maxLength={200} onChange={(e) => setAddress(e.target.value)} className={FIELD} />
      </div>

      <fieldset>
        <legend className='mb-1 text-sm font-bold'>شبکه‌های اجتماعی</legend>
        <p className='mb-3 text-xs text-ink/60'>نام کاربری (مثل mahpari) یا آدرس کامل صفحه را بنویسید. خالی بماند، نمایش داده نمی‌شود.</p>
        <div className='space-y-3'>
          {data.socials.map((s) => (
            <div key={s.id}>
              <label htmlFor={'st-' + s.id} className='mb-1 block text-xs text-ink/70'>{s.label}</label>
              <input
                id={'st-' + s.id}
                dir='ltr'
                value={socials[s.id] ?? ''}
                maxLength={200}
                autoCapitalize='none'
                autoCorrect='off'
                onChange={(e) => setSocials((prev) => ({ ...prev, [s.id]: e.target.value }))}
                className={FIELD + ' text-left'}
              />
            </div>
          ))}
        </div>
      </fieldset>

      <div aria-live='polite' className={'min-h-5 text-sm ' + (message?.ok ? 'text-brand' : 'text-rose')}>{message?.text}</div>

      <button type='submit' disabled={busy || !dirty} className='w-full rounded-full bg-brand py-3.5 font-bold text-white disabled:opacity-50'>
        {busy ? 'در حال ذخیره…' : 'ذخیره'}
      </button>
    </form>
  );
}
