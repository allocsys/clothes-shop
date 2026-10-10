'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { categoryOptions } from '@/data/categories';
import type { BasicsErrors } from '@/lib/adminProducts';
import { parseCount, parseToman } from '@/lib/parseNumber';

const FIELD = 'w-full rounded-2xl border border-ink/15 bg-surface px-4 py-3 outline-none focus:border-brand';
const SMALL = 'w-full rounded-xl border border-ink/15 bg-surface px-3 py-2.5 outline-none focus:border-brand';
const SIZE_HINTS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free'];
const options = categoryOptions();
const fa = (n: number) => new Intl.NumberFormat('fa-IR').format(n);

type Row = { key: number; size: string; color: string; stock: string };

export default function NewProductForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(options[0]?.slug ?? '');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(false); // starts hidden: show it after the photos are added
  const [rows, setRows] = useState<Row[]>([{ key: 0, size: '', color: '', stock: '1' }]);
  const [nextKey, setNextKey] = useState(1);
  const [errors, setErrors] = useState<BasicsErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const priceN = parseToman(price);
  const oldN = parseToman(oldPrice);
  const percent =
    typeof priceN === 'number' && typeof oldN === 'number' && oldN > priceN && priceN >= 0 ? Math.round((1 - priceN / oldN) * 100) : null;

  const update = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const addRow = () => {
    const last = rows[rows.length - 1];
    setRows((rs) => [...rs, { key: nextKey, size: '', color: last?.color ?? '', stock: '1' }]);
    setNextKey(nextKey + 1);
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setMessage(null);

    const local: BasicsErrors = {};
    if (!title.trim()) local.title = 'نام محصول را وارد کنید.';
    if (typeof priceN !== 'number') local.price = 'قیمت را به تومان و به صورت عدد وارد کنید.';
    if (oldN === 'bad') local.oldPrice = 'قیمت قبل از تخفیف باید عدد باشد (یا خالی بماند).';
    setErrors(local);
    if (Object.keys(local).length) {
      setMessage('لطفاً خطاهای فرم را اصلاح کنید.');
      return;
    }
    const stocks = rows.map((r) => parseCount(r.stock));
    if (rows.some((r) => !r.size.trim() || !r.color.trim()) || stocks.some((s) => s === null)) {
      setMessage('برای هر ردیف سایز، رنگ و موجودی (عدد ۰ یا بیشتر) را وارد کنید.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, category, price: priceN, oldPrice: oldN === 'bad' ? null : oldN, isActive,
          variants: rows.map((r, i) => ({ size: r.size, color: r.color, stock: stocks[i], loaded: null })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 201) {
        router.replace('/admin/products/' + data.product.id + '?new=1');
      } else if (res.status === 400) {
        if (data.errors) setErrors(data.errors);
        setMessage(data.message || 'لطفاً خطاهای فرم را اصلاح کنید.');
      } else if (res.status === 401) {
        setMessage('نشست شما تمام شده است. دوباره وارد شوید.');
        router.replace('/admin/login');
      } else {
        setMessage('ذخیره نشد. دوباره تلاش کنید.');
      }
    } catch {
      setMessage('ارتباط با سرور برقرار نشد. دوباره تلاش کنید.');
    } finally {
      setBusy(false);
    }
  }

  const err = (k: keyof BasicsErrors) => (errors[k] ? <p className='mt-1 text-sm text-rose'>{errors[k]}</p> : null);

  return (
    <form onSubmit={onSubmit} className='mt-5 space-y-5' noValidate>
      <div>
        <label htmlFor='n-title' className='mb-1 block text-sm font-bold'>نام محصول</label>
        <input id='n-title' value={title} onChange={(e) => setTitle(e.target.value)} className={FIELD} maxLength={120} />
        {err('title')}
      </div>

      <div>
        <label htmlFor='n-cat' className='mb-1 block text-sm font-bold'>دسته‌بندی</label>
        <select id='n-cat' value={category} onChange={(e) => setCategory(e.target.value)} className={FIELD}>
          {options.map((o) => (
            <option key={o.slug} value={o.slug}>{o.title}</option>
          ))}
        </select>
        {err('category')}
      </div>

      <div className='grid grid-cols-2 gap-3'>
        <div>
          <label htmlFor='n-price' className='mb-1 block text-sm font-bold'>قیمت (تومان)</label>
          <input id='n-price' inputMode='numeric' dir='ltr' value={price} onChange={(e) => setPrice(e.target.value)} className={FIELD + ' text-left'} />
          {err('price')}
        </div>
        <div>
          <label htmlFor='n-old' className='mb-1 block text-sm font-bold'>قبل از تخفیف</label>
          <input id='n-old' inputMode='numeric' dir='ltr' value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} placeholder='بدون تخفیف' className={FIELD + ' text-left'} />
          {err('oldPrice')}
        </div>
      </div>
      {percent !== null && <p className='-mt-2 text-sm text-brand'>٪{fa(percent)} تخفیف در فروشگاه نمایش داده می‌شود.</p>}

      <div>
        <label htmlFor='n-desc' className='mb-1 block text-sm font-bold'>توضیحات</label>
        <textarea id='n-desc' rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={FIELD} maxLength={3000} />
        {err('description')}
      </div>

      <div>
        <h2 className='text-sm font-bold'>سایز، رنگ و موجودی</h2>
        <p className='mt-1 text-xs text-ink/60'>حداقل یک ردیف لازم است. موجودی ۰ یعنی ناموجود.</p>
        <datalist id='new-size-hints'>{SIZE_HINTS.map((s) => <option key={s} value={s} />)}</datalist>
        <ul className='mt-3 space-y-3'>
          {rows.map((r, i) => (
            <li key={r.key} className='rounded-2xl bg-surface p-3'>
              <div className='grid grid-cols-2 gap-2'>
                <input aria-label={`سایز ردیف ${i + 1}`} list='new-size-hints' dir='ltr' value={r.size} onChange={(e) => update(r.key, { size: e.target.value })} placeholder='سایز' maxLength={20} className={SMALL + ' text-left'} />
                <input aria-label={`رنگ ردیف ${i + 1}`} value={r.color} onChange={(e) => update(r.key, { color: e.target.value })} placeholder='رنگ' maxLength={30} className={SMALL} />
              </div>
              <div className='mt-2 flex items-center gap-2'>
                <label className='text-sm' htmlFor={'ns-' + r.key}>موجودی</label>
                <input id={'ns-' + r.key} inputMode='numeric' dir='ltr' value={r.stock} onChange={(e) => update(r.key, { stock: e.target.value })} className={SMALL + ' w-24 text-left'} />
                <button type='button' onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} disabled={rows.length <= 1} className='ms-auto rounded-full border border-rose/40 px-3 py-2 text-sm text-rose disabled:opacity-40'>
                  حذف
                </button>
              </div>
            </li>
          ))}
        </ul>
        <button type='button' onClick={addRow} className='mt-3 w-full rounded-full border border-dashed border-brand py-3 text-sm font-bold text-brand'>
          + افزودن سایز / رنگ
        </button>
      </div>

      <label className='flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-surface p-4'>
        <span>
          <span className='block font-bold'>نمایش در فروشگاه</span>
          <span className='block text-xs text-ink/60'>
            {isActive ? 'بعد از ساخت، مشتری‌ها این محصول را می‌بینند.' : 'مخفی می‌ماند تا عکس‌ها را اضافه کنید و بعد نمایش دهید.'}
          </span>
        </span>
        <input type='checkbox' checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className='h-6 w-6 accent-[rgb(var(--c-brand))]' />
      </label>

      <div aria-live='polite' className='min-h-5 text-sm text-rose'>{message}</div>

      <button type='submit' disabled={busy} className='w-full rounded-full bg-brand py-3.5 font-bold text-white disabled:opacity-50'>
        {busy ? 'در حال ساخت…' : 'ساخت محصول'}
      </button>
    </form>
  );
}
