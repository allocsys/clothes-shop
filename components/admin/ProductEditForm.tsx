'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { categoryOptions } from '@/data/categories';
import type { AdminProduct, BasicsErrors } from '@/lib/adminProducts';
import { parseToman } from '@/lib/parseNumber';

const FIELD = 'w-full rounded-2xl border border-ink/15 bg-surface px-4 py-3 outline-none focus:border-brand';
const options = categoryOptions();

const show = (n: number | null) => (n == null ? '' : new Intl.NumberFormat('en-US').format(n));
const fa = (n: number) => new Intl.NumberFormat('fa-IR').format(n);

export default function ProductEditForm({ product }: { product: AdminProduct }) {
  const router = useRouter();
  const [base, setBase] = useState(product); // last saved version
  const [title, setTitle] = useState(product.title);
  const [category, setCategory] = useState(product.category);
  const [price, setPrice] = useState(show(product.price));
  const [oldPrice, setOldPrice] = useState(show(product.oldPrice));
  const [weight, setWeight] = useState(product.weightG == null ? '' : String(product.weightG));
  const [description, setDescription] = useState(product.description);
  const [isActive, setIsActive] = useState(product.isActive);
  const [errors, setErrors] = useState<BasicsErrors>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const priceN = parseToman(price);
  const oldN = parseToman(oldPrice);
  const weightN = parseToman(weight);
  const dirty =
    title !== base.title ||
    category !== base.category ||
    priceN !== base.price ||
    oldN !== base.oldPrice ||
    weightN !== base.weightG ||
    description !== base.description ||
    isActive !== base.isActive;
  const percent =
    typeof priceN === 'number' && typeof oldN === 'number' && oldN > priceN && priceN >= 0
      ? Math.round((1 - priceN / oldN) * 100)
      : null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || !dirty) return;
    setMessage(null);

    const local: BasicsErrors = {};
    if (typeof priceN !== 'number') local.price = 'قیمت را به تومان و به صورت عدد وارد کنید.';
    if (oldN === 'bad') local.oldPrice = 'قیمت قبل از تخفیف باید عدد باشد (یا خالی بماند).';
    if (weightN === 'bad' || (typeof weightN === 'number' && (weightN < 1 || weightN > 20000))) local.weightG = 'وزن را به گرم و بین ۱ تا ۲۰۰۰۰ بنویسید (یا خالی بگذارید).';
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const res = await fetch('/api/admin/products/' + product.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category, price: priceN, oldPrice: oldN, isActive, weightG: typeof weightN === 'number' ? weightN : null }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const saved = data.product as AdminProduct;
        setBase(saved);
        setTitle(saved.title);
        setDescription(saved.description);
        setPrice(show(saved.price));
        setOldPrice(show(saved.oldPrice));
        setWeight(saved.weightG == null ? '' : String(saved.weightG));
        setMessage({ ok: true, text: 'ذخیره شد.' });
        router.refresh();
      } else if (res.status === 400 && data.errors) {
        setErrors(data.errors);
        setMessage({ ok: false, text: 'لطفاً خطاهای فرم را اصلاح کنید.' });
      } else if (res.status === 401) {
        setMessage({ ok: false, text: 'نشست شما تمام شده است. دوباره وارد شوید.' });
        router.replace('/admin/login');
      } else {
        setMessage({ ok: false, text: 'ذخیره نشد. دوباره تلاش کنید.' });
      }
    } catch {
      setMessage({ ok: false, text: 'ارتباط با سرور برقرار نشد. دوباره تلاش کنید.' });
    } finally {
      setBusy(false);
    }
  }

  const err = (k: keyof BasicsErrors) => (errors[k] ? <p className='mt-1 text-sm text-rose'>{errors[k]}</p> : null);

  return (
    <form onSubmit={onSubmit} className='mt-5 space-y-5'>
      <div>
        <label htmlFor='p-title' className='mb-1 block text-sm font-bold'>نام محصول</label>
        <input id='p-title' value={title} onChange={(e) => setTitle(e.target.value)} className={FIELD} maxLength={120} />
        {err('title')}
      </div>

      <div>
        <label htmlFor='p-cat' className='mb-1 block text-sm font-bold'>دسته‌بندی</label>
        <select id='p-cat' value={category} onChange={(e) => setCategory(e.target.value)} className={FIELD}>
          {options.map((o) => (
            <option key={o.slug} value={o.slug}>{o.title}</option>
          ))}
        </select>
        {err('category')}
      </div>

      <div className='grid grid-cols-2 gap-3'>
        <div>
          <label htmlFor='p-price' className='mb-1 block text-sm font-bold'>قیمت (تومان)</label>
          <input id='p-price' inputMode='numeric' dir='ltr' value={price} onChange={(e) => setPrice(e.target.value)} className={FIELD + ' text-left'} />
          {err('price')}
        </div>
        <div>
          <label htmlFor='p-old' className='mb-1 block text-sm font-bold'>قبل از تخفیف</label>
          <input id='p-old' inputMode='numeric' dir='ltr' value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} placeholder='بدون تخفیف' className={FIELD + ' text-left'} />
          {err('oldPrice')}
        </div>
      </div>
      {percent !== null && <p className='-mt-2 text-sm text-brand'>٪{fa(percent)} تخفیف در فروشگاه نمایش داده می‌شود.</p>}

      <div>
        <label htmlFor='p-weight' className='mb-1 block text-sm font-bold'>وزن یک عدد (گرم)</label>
        <input id='p-weight' inputMode='numeric' dir='ltr' value={weight} onChange={(e) => setWeight(e.target.value)} placeholder='خالی = وزن معمول دسته' className={FIELD + ' text-left'} />
        <p className='mt-1 text-xs text-ink/60'>برای محاسبهٔ هزینهٔ ارسال. اگر خالی بماند، وزن معمول این دسته‌بندی حساب می‌شود.</p>
        {err('weightG')}
      </div>

      <div>
        <label htmlFor='p-desc' className='mb-1 block text-sm font-bold'>توضیحات</label>
        <textarea id='p-desc' rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className={FIELD} maxLength={3000} />
        {err('description')}
      </div>

      <label className='flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-surface p-4'>
        <span>
          <span className='block font-bold'>نمایش در فروشگاه</span>
          <span className='block text-xs text-ink/60'>{isActive ? 'مشتری‌ها این محصول را می‌بینند.' : 'مخفی است و مشتری‌ها آن را نمی‌بینند.'}</span>
        </span>
        <input type='checkbox' checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className='h-6 w-6 accent-[rgb(var(--c-brand))]' />
      </label>

      <div aria-live='polite' className={'min-h-5 text-sm ' + (message?.ok ? 'text-brand' : 'text-rose')}>{message?.text}</div>

      <div className='flex items-center gap-3'>
        <button type='submit' disabled={busy || !dirty} className='flex-1 rounded-full bg-brand py-3.5 font-bold text-white disabled:opacity-50'>
          {busy ? 'در حال ذخیره…' : 'ذخیره تغییرات'}
        </button>
        {base.isActive && (
          <Link href={'/product/' + base.slug} target='_blank' className='rounded-full border border-ink/20 px-4 py-3 text-sm'>
            مشاهده
          </Link>
        )}
      </div>
    </form>
  );
}
