'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductImage from '@/components/ProductImage';

const MAX_PHOTOS = 10;
const MAX_SIDE = 1600;
const fa = (n: number) => new Intl.NumberFormat('fa-IR').format(n);

// Shrinks a phone photo in the browser before upload (a 6 MB camera photo becomes a few hundred KB).
// If anything fails the original file is sent and the server decides.
async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

type Msg = { ok: boolean; text: string } | null;

export default function PhotoManager({
  productId, category, slug, title, initial,
}: { productId: number; category: string; slug: string; title: string; initial: string[] }) {
  const router = useRouter();
  const [images, setImages] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [message, setMessage] = useState<Msg>(null);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const url = '/api/admin/products/' + productId + '/photos';

  function fail(status: number, data: { message?: string }, fallback: string) {
    if (status === 401) {
      setMessage({ ok: false, text: 'نشست شما تمام شده است. دوباره وارد شوید.' });
      router.replace('/admin/login');
    } else if (status === 409) {
      setMessage({ ok: false, text: 'عکس‌های این محصول در همین فاصله تغییر کرده. صفحه را دوباره باز کنید.' });
    } else {
      setMessage({ ok: false, text: data.message || fallback });
    }
  }

  async function onPick(files: FileList | null) {
    if (!files || files.length === 0 || busy) return;
    const list = Array.from(files).slice(0, MAX_PHOTOS - images.length);
    if (list.length === 0) {
      setMessage({ ok: false, text: `حداکثر ${fa(MAX_PHOTOS)} عکس برای هر محصول.` });
      return;
    }
    setBusy(true);
    setMessage(null);
    let current = images;
    let done = 0;
    try {
      for (const file of list) {
        setProgress(`در حال بارگذاری ${fa(done + 1)} از ${fa(list.length)}…`);
        const form = new FormData();
        form.append('file', await shrink(file), 'photo.jpg');
        const res = await fetch(url, { method: 'POST', body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          fail(res.status, data, 'بارگذاری نشد. دوباره تلاش کنید.');
          break;
        }
        current = data.images as string[];
        setImages(current);
        done++;
      }
      if (done === list.length) setMessage({ ok: true, text: done === 1 ? 'عکس اضافه شد.' : `${fa(done)} عکس اضافه شد.` });
      if (done > 0) router.refresh();
    } catch {
      setMessage({ ok: false, text: 'ارتباط با سرور برقرار نشد. دوباره تلاش کنید.' });
    } finally {
      setBusy(false);
      setProgress('');
    }
  }

  async function reorder(next: string[]) {
    if (busy) return;
    const before = images;
    setImages(next); // show the change at once
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ images: next }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ ok: true, text: 'ترتیب عکس‌ها ذخیره شد.' });
        router.refresh();
      } else {
        setImages(before);
        fail(res.status, data, 'ذخیره نشد. دوباره تلاش کنید.');
      }
    } catch {
      setImages(before);
      setMessage({ ok: false, text: 'ارتباط با سرور برقرار نشد.' });
    } finally {
      setBusy(false);
    }
  }

  const move = (i: number, to: number) => {
    const next = images.slice();
    const [k] = next.splice(i, 1);
    next.splice(to, 0, k);
    return reorder(next);
  };

  async function remove(key: string) {
    if (busy) return;
    if (confirmKey !== key) {
      setConfirmKey(key);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setConfirmKey(null), 4000);
      return;
    }
    setConfirmKey(null);
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(url, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setImages(data.images as string[]);
        setMessage({ ok: true, text: 'عکس حذف شد.' });
        router.refresh();
      } else {
        fail(res.status, data, 'حذف نشد. دوباره تلاش کنید.');
      }
    } catch {
      setMessage({ ok: false, text: 'ارتباط با سرور برقرار نشد.' });
    } finally {
      setBusy(false);
    }
  }

  const BTN = 'rounded-full border border-ink/20 px-3 py-2 text-xs disabled:opacity-40';

  return (
    <section className='mt-10 border-t border-ink/10 pt-6' aria-labelledby='photos-h'>
      <h2 id='photos-h' className='text-lg font-bold'>عکس‌ها</h2>
      <p className='mt-1 text-xs text-ink/60'>عکس اول، عکس اصلی محصول است. حداکثر {fa(MAX_PHOTOS)} عکس.</p>

      {images.length === 0 ? (
        <p className='mt-4 rounded-2xl bg-surface p-4 text-sm text-ink/70'>هنوز عکسی اضافه نشده؛ در فروشگاه نقشهٔ لباس نمایش داده می‌شود.</p>
      ) : (
        <ul className='mt-4 grid grid-cols-2 gap-3'>
          {images.map((key, i) => (
            <li key={key} className='rounded-2xl bg-surface p-2'>
              <div className='relative aspect-[3/4] overflow-hidden rounded-xl'>
                <ProductImage image={key} category={category} seed={slug} alt={`${title} - عکس ${i + 1}`} sizes='180px' />
                {i === 0 && <span className='absolute start-2 top-2 rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white'>اصلی</span>}
              </div>
              <div className='mt-2 flex flex-wrap items-center gap-1.5'>
                {i > 0 && <button type='button' disabled={busy} onClick={() => move(i, 0)} className={BTN}>اصلی کن</button>}
                <button type='button' disabled={busy || i === 0} onClick={() => move(i, i - 1)} aria-label='یکی جلوتر' className={BTN}>→</button>
                <button type='button' disabled={busy || i === images.length - 1} onClick={() => move(i, i + 1)} aria-label='یکی عقب‌تر' className={BTN}>←</button>
                <button
                  type='button'
                  disabled={busy}
                  onClick={() => remove(key)}
                  className={'ms-auto rounded-full border px-3 py-2 text-xs disabled:opacity-40 ' + (confirmKey === key ? 'border-rose bg-rose text-white' : 'border-rose/40 text-rose')}
                >
                  {confirmKey === key ? 'مطمئنی؟ حذف' : 'حذف'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <label className={'mt-4 block w-full cursor-pointer rounded-full border border-dashed border-brand py-3 text-center text-sm font-bold text-brand ' + (busy || images.length >= MAX_PHOTOS ? 'pointer-events-none opacity-50' : '')}>
        {progress || '+ افزودن عکس'}
        <input
          type='file'
          accept='image/*'
          multiple
          className='sr-only'
          disabled={busy || images.length >= MAX_PHOTOS}
          onChange={(e) => {
            const input = e.target;
            const files = input.files;
            void onPick(files).finally(() => { input.value = ''; });
          }}
        />
      </label>

      <div aria-live='polite' className={'mt-3 min-h-5 text-sm ' + (message?.ok ? 'text-brand' : 'text-rose')}>{message?.text}</div>
    </section>
  );
}
