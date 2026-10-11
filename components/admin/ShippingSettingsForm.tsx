'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { parseToman } from '@/lib/parseNumber';

type Zone = 'same' | 'near' | 'far';
type ZonePrices = { fees: number[]; extraPerKg: number };

export type ShippingFormData = {
  carrier: string; // the carrier in use now
  packagingG: number;
  carriers: { id: string; label: string }[];
  bandsG: number[]; // weight limits of the fee boxes, in grams
  rates: Record<string, Partial<Record<Zone, ZonePrices>>>;
};

const ZONES: { id: Zone; label: string }[] = [
  { id: 'same', label: 'همان استان (خراسان رضوی)' },
  { id: 'near', label: 'استان‌های همجوار' },
  { id: 'far', label: 'سایر استان‌ها' },
];

const FIELD = 'w-full rounded-xl border border-ink/15 bg-transparent px-3 py-2.5 text-left outline-none focus:border-brand';
const fa = (n: number) => new Intl.NumberFormat('fa-IR').format(n);
const cellKey = (c: string, z: Zone) => c + ':' + z;

// What one zone's five boxes hold: the numbers, 'empty' (all blank), 'partial' or 'bad'.
function readZone(cells: string[]): number[] | 'empty' | 'partial' | 'bad' {
  const v = cells.map(parseToman);
  if (v.includes('bad')) return 'bad';
  const filled = v.filter((x) => x !== null).length;
  if (filled === 0) return 'empty';
  if (filled < v.length) return 'partial';
  return v as number[];
}

export default function ShippingSettingsForm({ data }: { data: ShippingFormData }) {
  const router = useRouter();
  const boxes = data.bandsG.length + 1; // the fee boxes plus "every extra kg"
  const labelOf = (id: string) => data.carriers.find((c) => c.id === id)?.label ?? id;
  const zoneLabel = (id: Zone) => ZONES.find((z) => z.id === id)?.label ?? id;

  const [carrier, setCarrier] = useState(data.carrier);
  const [packaging, setPackaging] = useState(String(data.packagingG));
  const [cells, setCells] = useState<Record<string, string[]>>(() => {
    const m: Record<string, string[]> = {};
    for (const c of data.carriers) {
      for (const z of ZONES) {
        const zr = data.rates[c.id]?.[z.id];
        m[cellKey(c.id, z.id)] = zr ? [...zr.fees, zr.extraPerKg].map(String) : Array<string>(boxes).fill('');
      }
    }
    return m;
  });
  const snapshot = (cr: string, pk: string, ce: Record<string, string[]>) => JSON.stringify([cr, pk, ce]);
  const [saved, setSaved] = useState(() => snapshot(data.carrier, String(data.packagingG), cells));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const dirty = snapshot(carrier, packaging, cells) !== saved;
  const complete = (c: string) => ZONES.every((z) => Array.isArray(readZone(cells[cellKey(c, z.id)])));

  function setCell(c: string, z: Zone, i: number, value: string) {
    setCells((prev) => {
      const next = [...prev[cellKey(c, z)]];
      next[i] = value;
      return { ...prev, [cellKey(c, z)]: next };
    });
  }

  function serverText(error: string, c?: string, z?: Zone) {
    const where = c && z ? `«${labelOf(c)} – ${zoneLabel(z)}»` : '';
    if (error === 'partial_zone') return `قیمت‌های ${where} نیمه‌کاره است؛ همهٔ خانه‌ها را پر کنید یا همه را خالی بگذارید.`;
    if (error === 'fees_decrease') return `در ${where} قیمت با بالا رفتن وزن نباید کمتر شود.`;
    if (error === 'incomplete_carrier') return `برای انتخاب «${c ? labelOf(c) : 'این شرکت'}» باید قیمت هر سه منطقه کامل باشد.`;
    if (error === 'bad_input') return `عدد نامعتبر ${where}`.trim() + '.';
    return 'ذخیره نشد. دوباره تلاش کنید.';
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || !dirty) return;
    setMessage(null);

    const packagingN = parseToman(packaging);
    if (typeof packagingN !== 'number' || packagingN > 5000) {
      setMessage({ ok: false, text: 'وزن بسته‌بندی را به گرم و بین ۰ تا ۵۰۰۰ بنویسید.' });
      return;
    }
    const rates: Record<string, Record<string, ZonePrices | null>> = {};
    for (const c of data.carriers) {
      rates[c.id] = {};
      for (const z of ZONES) {
        const r = readZone(cells[cellKey(c.id, z.id)]);
        if (r === 'bad') {
          setMessage({ ok: false, text: `در «${c.label} – ${z.label}» فقط عدد وارد کنید.` });
          return;
        }
        if (r === 'partial') {
          setMessage({ ok: false, text: serverText('partial_zone', c.id, z.id) });
          return;
        }
        rates[c.id][z.id] = Array.isArray(r) ? { fees: r.slice(0, boxes - 1), extraPerKg: r[boxes - 1] } : null;
      }
    }
    if (!complete(carrier)) {
      setMessage({ ok: false, text: serverText('incomplete_carrier', carrier) });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/admin/shipping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrier, packagingG: packagingN, rates }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setSaved(snapshot(carrier, packaging, cells));
        setMessage({ ok: true, text: 'ذخیره شد. از همین حالا در سبد خرید مشتری‌ها اعمال می‌شود.' });
        router.refresh();
      } else if (res.status === 401) {
        setMessage({ ok: false, text: 'نشست شما تمام شده است. دوباره وارد شوید.' });
        router.replace('/admin/login');
      } else {
        setMessage({ ok: false, text: serverText(String(body.error ?? ''), body.carrier, body.zone) });
      }
    } catch {
      setMessage({ ok: false, text: 'ارتباط با سرور برقرار نشد. دوباره تلاش کنید.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className='mt-5 space-y-6'>
      <fieldset>
        <legend className='mb-2 text-sm font-bold'>ارسال با کدام شرکت انجام شود؟</legend>
        <div className='space-y-2'>
          {data.carriers.map((c) => {
            const ok = complete(c.id);
            return (
              <label key={c.id} className={'flex items-center justify-between gap-3 rounded-2xl bg-surface p-4 ' + (ok ? 'cursor-pointer' : 'opacity-60')}>
                <span>
                  <span className='block font-bold'>{c.label}</span>
                  {!ok && <span className='block text-xs text-ink/60'>اول قیمت هر سه منطقه را پایین پر کنید.</span>}
                </span>
                <input
                  type='radio'
                  name='carrier'
                  value={c.id}
                  checked={carrier === c.id}
                  disabled={!ok}
                  onChange={() => setCarrier(c.id)}
                  className='h-6 w-6 accent-[rgb(var(--c-brand))]'
                />
              </label>
            );
          })}
        </div>
      </fieldset>

      <div>
        <h2 className='font-bold'>قیمت‌ها (تومان)</h2>
        <p className='mt-1 text-xs text-ink/60'>
          برای هر منطقه، قیمت ارسال تا وزن مشخص‌شده و قیمت هر کیلوی اضافه را بنویسید. قیمت پیشتاز و تیپاکس را از لیست رسمی یا برآوردگر خودشان بگیرید.
        </p>
        <div className='mt-3 space-y-3'>
          {data.carriers.map((c) => (
            <details key={c.id} open={c.id === data.carrier} className='rounded-2xl bg-surface p-4'>
              <summary className='cursor-pointer font-bold'>
                {c.label} <span className={'text-xs font-normal ' + (complete(c.id) ? 'text-brand' : 'text-ink/60')}>{complete(c.id) ? '· کامل' : '· ناقص'}</span>
              </summary>
              <div className='mt-3 space-y-4'>
                {ZONES.map((z) => (
                  <fieldset key={z.id}>
                    <legend className='mb-2 text-sm font-bold'>{z.label}</legend>
                    <div className='grid grid-cols-2 gap-2'>
                      {cells[cellKey(c.id, z.id)].map((value, i) => (
                        <label key={i} className='block'>
                          <span className='mb-1 block text-xs text-ink/70'>
                            {i < data.bandsG.length ? `تا ${fa(data.bandsG[i] / 1000)} کیلو` : 'هر کیلوی اضافه'}
                          </span>
                          <input inputMode='numeric' dir='ltr' value={value} onChange={(e) => setCell(c.id, z.id, i, e.target.value)} className={FIELD} />
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor='s-pack' className='mb-1 block text-sm font-bold'>وزن بسته‌بندی (گرم)</label>
        <input id='s-pack' inputMode='numeric' dir='ltr' value={packaging} onChange={(e) => setPackaging(e.target.value)} className={'w-full rounded-2xl border border-ink/15 bg-surface px-4 py-3 text-left outline-none focus:border-brand'} />
        <p className='mt-1 text-xs text-ink/60'>وزن کارتن یا کیسه؛ به وزن هر سفارش اضافه می‌شود.</p>
      </div>

      <div aria-live='polite' className={'min-h-5 text-sm ' + (message?.ok ? 'text-brand' : 'text-rose')}>{message?.text}</div>

      <button type='submit' disabled={busy || !dirty} className='w-full rounded-full bg-brand py-3.5 font-bold text-white disabled:opacity-50'>
        {busy ? 'در حال ذخیره…' : 'ذخیره تنظیمات ارسال'}
      </button>
    </form>
  );
}
