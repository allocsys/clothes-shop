'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminVariant } from '@/lib/adminVariants';
import { parseCount } from '@/lib/parseNumber';

const FIELD = 'w-full rounded-xl border border-ink/15 bg-surface px-3 py-2.5 outline-none focus:border-brand';
const SIZE_HINTS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free'];

type Row = { key: number; size: string; color: string; stock: string; loaded: number | null };

const toRows = (list: AdminVariant[], start = 0): Row[] =>
  list.map((v, i) => ({ key: start + i, size: v.size, color: v.color, stock: String(v.stock), loaded: v.stock }));

export default function VariantsEditor({ productId, initial }: { productId: number; initial: AdminVariant[] }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [rows, setRows] = useState<Row[]>(() => toRows(initial));
  const [next, setNext] = useState(initial.length);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const current = rows.map((r) => ({ size: r.size.trim(), color: r.color.trim(), stock: parseCount(r.stock) }));
  const dirty =
    rows.length !== saved.length ||
    current.some((c, i) => c.size !== saved[i]?.size || c.color !== saved[i]?.color || c.stock !== saved[i]?.stock);
  const total = current.reduce((n, c) => n + (c.stock ?? 0), 0);

  const update = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const remove = (key: number) => setRows((rs) => rs.filter((r) => r.key !== key));
  const add = () => {
    const last = rows[rows.length - 1];
    setRows((rs) => [...rs, { key: next, size: '', color: last?.color ?? '', stock: '0', loaded: null }]);
    setNext(next + 1);
  };

  async function save() {
    if (busy || !dirty) return;
    setMessage(null);
    if (current.some((c) => c.stock === null)) {
      setMessage({ ok: false, text: 'موجودی هر ردیف باید یک عدد (۰ یا بیشتر) باشد.' });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/admin/products/' + productId + '/variants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variants: rows.map((r) => ({ size: r.size, color: r.color, stock: parseCount(r.stock), loaded: r.loaded })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const list = data.variants as AdminVariant[];
        setSaved(list);
        setRows(toRows(list, next));
        setNext(next + list.length);
        setMessage({ ok: true, text: 'موجودی ذخیره شد.' });
        router.refresh();
      } else if (res.status === 409) {
        setMessage({ ok: false, text: `موجودی «${data.label}» در همین فاصله تغییر کرده (احتمالاً سفارش جدید). صفحه را دوباره باز کنید و تغییر را دوباره بزنید.` });
      } else if (res.status === 400 && data.message) {
        setMessage({ ok: false, text: data.message });
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

  return (
    <section className='mt-10 border-t border-ink/10 pt-6' aria-labelledby='variants-h'>
      <h2 id='variants-h' className='text-lg font-bold'>سایز، رنگ و موجودی</h2>
      <p className='mt-1 text-xs text-ink/60'>هر ردیف یک سایز + رنگ است. موجودی ۰ یعنی ناموجود. جمع موجودی: {new Intl.NumberFormat('fa-IR').format(total)}</p>

      <datalist id='size-hints'>{SIZE_HINTS.map((s) => <option key={s} value={s} />)}</datalist>

      <ul className='mt-4 space-y-3'>
        {rows.map((r, i) => (
          <li key={r.key} className='rounded-2xl bg-surface p-3'>
            <div className='grid grid-cols-2 gap-2'>
              <input aria-label={`سایز ردیف ${i + 1}`} list='size-hints' dir='ltr' value={r.size} onChange={(e) => update(r.key, { size: e.target.value })} placeholder='سایز' maxLength={20} className={FIELD + ' text-left'} />
              <input aria-label={`رنگ ردیف ${i + 1}`} value={r.color} onChange={(e) => update(r.key, { color: e.target.value })} placeholder='رنگ' maxLength={30} className={FIELD} />
            </div>
            <div className='mt-2 flex items-center gap-2'>
              <label className='text-sm' htmlFor={'st-' + r.key}>موجودی</label>
              <input id={'st-' + r.key} inputMode='numeric' dir='ltr' value={r.stock} onChange={(e) => update(r.key, { stock: e.target.value })} className={FIELD + ' w-24 text-left'} />
              <button type='button' onClick={() => remove(r.key)} disabled={rows.length <= 1} className='ms-auto rounded-full border border-rose/40 px-3 py-2 text-sm text-rose disabled:opacity-40'>
                حذف
              </button>
            </div>
          </li>
        ))}
      </ul>

      <button type='button' onClick={add} className='mt-3 w-full rounded-full border border-dashed border-brand py-3 text-sm font-bold text-brand'>
        + افزودن سایز / رنگ
      </button>

      <div aria-live='polite' className={'mt-3 min-h-5 text-sm ' + (message?.ok ? 'text-brand' : 'text-rose')}>{message?.text}</div>

      <button type='button' onClick={save} disabled={busy || !dirty} className='mt-2 w-full rounded-full bg-brand py-3.5 font-bold text-white disabled:opacity-50'>
        {busy ? 'در حال ذخیره…' : 'ذخیره موجودی'}
      </button>
    </section>
  );
}
