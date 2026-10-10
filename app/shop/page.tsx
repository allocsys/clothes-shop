import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { categories, categorySlugs } from '@/data/categories';
import { toEnglishDigits } from '@/lib/checkout';
import { formatPrice } from '@/lib/format';
import { getProducts } from '@/lib/products';

export const metadata = { title: 'فروشگاه' };
export const dynamic = 'force-dynamic';

type Raw = string | string[] | undefined;
type Props = {
  searchParams: Promise<{ category?: Raw; q?: Raw; sort?: Raw; size?: Raw; color?: Raw; min?: Raw; max?: Raw }>;
};

type State = { category: string; q: string; sort: string; sizes: string[]; colors: string[]; min?: number; max?: number };

const one = (v: Raw) => (Array.isArray(v) ? v[0] ?? '' : v ?? '').trim();
const many = (v: Raw) => (v === undefined ? [] : Array.isArray(v) ? v : [v]).filter(Boolean);
const num = (v: Raw) => {
  const n = parseInt(toEnglishDigits(one(v)).replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : undefined;
};

const SIZE_ORDER = ['Free', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
const sizesOf = (products: { sizes: string[] }[]) =>
  Array.from(new Set(products.flatMap((p) => p.sizes))).sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a);
    const ib = SIZE_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
const colorsOf = (products: { colors: string[] }[]) =>
  Array.from(new Set(products.flatMap((p) => p.colors))).sort((a, b) => a.localeCompare(b, 'fa'));

const SORTS: [string, string][] = [
  ['', 'جدیدترین'],
  ['price-asc', 'ارزان‌ترین'],
  ['price-desc', 'گران‌ترین'],
  ['discount', 'بیشترین تخفیف'],
];

const chips = [
  { slug: '', title: 'همه' },
  ...categories.flatMap((c) => [c, ...(c.children ?? [])]).map((c) => ({ slug: c.slug, title: c.title })),
];

function href(s: State): string {
  const qs = new URLSearchParams();
  if (s.category) qs.set('category', s.category);
  if (s.q) qs.set('q', s.q);
  if (s.sort) qs.set('sort', s.sort);
  s.sizes.forEach((x) => qs.append('size', x));
  s.colors.forEach((x) => qs.append('color', x));
  if (s.min !== undefined) qs.set('min', String(s.min));
  if (s.max !== undefined) qs.set('max', String(s.max));
  const str = qs.toString();
  return str ? '/shop?' + str : '/shop';
}

const fa = (n: number) => new Intl.NumberFormat('fa-IR').format(n);
const discountOf = (p: { price: number; oldPrice?: number }) => (p.oldPrice ? (p.oldPrice - p.price) / p.oldPrice : 0);

export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams;
  const products = await getProducts();
  const allSizes = sizesOf(products);
  const allColors = colorsOf(products);
  const s: State = {
    category: one(sp.category),
    q: one(sp.q),
    sort: SORTS.some(([v]) => v === one(sp.sort)) ? one(sp.sort) : '',
    sizes: many(sp.size).filter((x) => allSizes.includes(x)),
    colors: many(sp.color).filter((x) => allColors.includes(x)),
    min: num(sp.min),
    max: num(sp.max),
  };

  let list = s.category ? products.filter((p) => categorySlugs(s.category).includes(p.category)) : products;
  if (s.q) list = list.filter((p) => p.title.includes(s.q));
  if (s.sizes.length) list = list.filter((p) => p.sizes.some((x) => s.sizes.includes(x)));
  if (s.colors.length) list = list.filter((p) => p.colors.some((x) => s.colors.includes(x)));
  if (s.min !== undefined) list = list.filter((p) => p.price >= s.min!);
  if (s.max !== undefined) list = list.filter((p) => p.price <= s.max!);
  if (s.sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
  if (s.sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
  if (s.sort === 'discount') list = [...list].sort((a, b) => discountOf(b) - discountOf(a));

  const activeCount = s.sizes.length + s.colors.length + (s.min !== undefined || s.max !== undefined ? 1 : 0) + (s.sort ? 1 : 0);

  // Removable "applied filter" pills
  const pills: { label: string; to: string }[] = [];
  if (s.q) pills.push({ label: 'جستجو: ' + s.q, to: href({ ...s, q: '' }) });
  s.sizes.forEach((x) => pills.push({ label: 'سایز ' + x, to: href({ ...s, sizes: s.sizes.filter((y) => y !== x) }) }));
  s.colors.forEach((x) => pills.push({ label: x, to: href({ ...s, colors: s.colors.filter((y) => y !== x) }) }));
  if (s.min !== undefined || s.max !== undefined) {
    const label =
      s.min !== undefined && s.max !== undefined
        ? formatPrice(s.min) + ' تا ' + formatPrice(s.max)
        : s.min !== undefined
          ? 'از ' + formatPrice(s.min)
          : 'تا ' + formatPrice(s.max!);
    pills.push({ label, to: href({ ...s, min: undefined, max: undefined }) });
  }

  const input = 'w-full rounded-xl border border-ink/15 bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand';
  const chipBox =
    'block cursor-pointer rounded-full border border-ink/20 bg-surface px-4 py-2.5 text-center text-sm text-ink transition-colors peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand/50';

  return (
    <section className='mt-6'>
      <div className='no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1'>
        {chips.map((c) => {
          const active = s.category === c.slug;
          return (
            <Link
              key={c.slug || 'all'}
              href={c.slug ? '/shop?category=' + c.slug : '/shop'}
              className={'shrink-0 rounded-full border px-4 py-2.5 text-sm ' + (active ? 'border-brand bg-brand text-white' : 'border-ink/15 bg-surface')}
            >
              {c.title}
            </Link>
          );
        })}
      </div>

      <h1 className='mb-3 text-xl font-bold'>
        محصولات <span className='text-sm font-normal text-ink/70'>({fa(list.length)} کالا)</span>
      </h1>

      <form action='/shop' className='mb-4'>
        {s.category && <input type='hidden' name='category' value={s.category} />}
        {s.q && <input type='hidden' name='q' value={s.q} />}

        <details className='group rounded-2xl border border-ink/10 bg-surface' open={activeCount > 0 ? true : undefined}>
          <summary className='flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-bold [&::-webkit-details-marker]:hidden'>
            <span>
              فیلتر و مرتب‌سازی
              {activeCount > 0 && <span className='mr-2 rounded-full bg-brand px-2 py-0.5 text-xs font-normal text-white'>{fa(activeCount)}</span>}
            </span>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='transition-transform group-open:rotate-180' aria-hidden='true'>
              <path d='M6 9l6 6 6-6' />
            </svg>
          </summary>

          <div className='space-y-5 border-t border-ink/10 px-4 pb-4 pt-4'>
            <div>
              <label htmlFor='sort' className='mb-2 block text-sm font-bold'>مرتب‌سازی</label>
              <select id='sort' name='sort' defaultValue={s.sort} className={input}>
                {SORTS.map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </div>

            <fieldset>
              <legend className='mb-2 text-sm font-bold'>سایز</legend>
              <div className='flex flex-wrap gap-2'>
                {allSizes.map((x) => (
                  <label key={x} className='min-w-10'>
                    <input type='checkbox' name='size' value={x} defaultChecked={s.sizes.includes(x)} className='peer sr-only' />
                    <span className={chipBox}>{x}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className='mb-2 text-sm font-bold'>رنگ</legend>
              <div className='flex flex-wrap gap-2'>
                {allColors.map((x) => (
                  <label key={x}>
                    <input type='checkbox' name='color' value={x} defaultChecked={s.colors.includes(x)} className='peer sr-only' />
                    <span className={chipBox}>{x}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className='mb-2 text-sm font-bold'>محدوده قیمت (تومان)</legend>
              <div className='grid grid-cols-2 gap-3'>
                <input name='min' inputMode='numeric' placeholder='از' defaultValue={s.min ?? ''} className={input} aria-label='حداقل قیمت' />
                <input name='max' inputMode='numeric' placeholder='تا' defaultValue={s.max ?? ''} className={input} aria-label='حداکثر قیمت' />
              </div>
            </fieldset>

            <div className='flex gap-3'>
              <button type='submit' className='flex-1 rounded-full bg-brand py-3 text-sm font-bold text-white'>اعمال فیلتر</button>
              <Link
                href={href({ category: s.category, q: s.q, sort: '', sizes: [], colors: [] })}
                className='rounded-full border border-ink/20 px-6 py-3 text-sm'
              >
                حذف فیلترها
              </Link>
            </div>
          </div>
        </details>
      </form>

      {pills.length > 0 && (
        <div className='mb-4 flex flex-wrap gap-2'>
          {pills.map((p) => (
            <Link key={p.label} href={p.to} className='inline-flex min-h-10 items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-xs text-brand'>
              {p.label}
              <span aria-hidden='true'>×</span>
              <span className='sr-only'>حذف</span>
            </Link>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <div className='py-20 text-center'>
          <p className='text-ink/70'>محصولی پیدا نشد. فیلتر یا عبارت جستجو را تغییر دهید.</p>
          <Link href={s.category ? '/shop?category=' + s.category : '/shop'} className='mt-4 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white'>
            حذف همه فیلترها
          </Link>
        </div>
      ) : (
        <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
          {list.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
