import Link from 'next/link';

type Slide = {
  title: string;
  sub: string;
  href: string;
  cta: string;
  from: string;
  to: string;
  phase: 'crescent' | 'half' | 'full';
};

const slides: Slide[] = [
  { title: 'کالکشن پاییزه', sub: 'مانتو، شومیز و ست‌های تازه رسیده', href: '/shop?category=manteau', cta: 'دیدن کالکشن', from: '#2a1d52', to: '#5a3d93', phase: 'crescent' },
  { title: 'ست‌های راحتی', sub: 'برای خانه، سفر و روزهای شلوغ', href: '/shop?category=set', cta: 'دیدن ست‌ها', from: '#3b1d4a', to: '#a24a73', phase: 'half' },
  { title: 'اکسسوری و شال', sub: 'تکمیل‌کننده استایل تو', href: '/shop?category=accessories', cta: 'دیدن اکسسوری', from: '#12304a', to: '#2f6f8a', phase: 'full' },
];

const stars: [string, string, number][] = [
  ['12%', '48%', 3], ['22%', '70%', 2], ['40%', '58%', 2], ['68%', '40%', 3], ['80%', '64%', 2], ['30%', '34%', 2],
];

function Moon({ id, phase }: { id: string; phase: Slide['phase'] }) {
  const cut = phase === 'crescent' ? 22 : phase === 'half' ? 44 : null;
  return (
    <svg viewBox='0 0 100 100' className='h-full w-full' aria-hidden='true'>
      <defs>
        <radialGradient id={id + '-g'}>
          <stop offset='0' stopColor='#fff6dc' />
          <stop offset='1' stopColor='#d9b36c' />
        </radialGradient>
        {cut !== null && (
          <mask id={id + '-m'}>
            <rect width='100' height='100' fill='white' />
            <circle cx={50 + cut} cy={46} r={40} fill='black' />
          </mask>
        )}
      </defs>
      <circle cx='50' cy='50' r='40' fill={'url(#' + id + '-g)'} mask={cut !== null ? 'url(#' + id + '-m)' : undefined} />
    </svg>
  );
}

export default function Hero() {
  return (
    <section aria-label='پیشنهادهای ویژه' className='no-scrollbar mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto'>
      {slides.map((s, i) => (
        <div
          key={s.title}
          className='relative h-72 min-w-[90%] snap-center overflow-hidden rounded-3xl md:h-96 md:min-w-[49%]'
          style={{ background: 'linear-gradient(135deg, ' + s.from + ', ' + s.to + ')' }}
        >
          {stars.map(([top, left, size], k) => (
            <span key={k} className='absolute rounded-full bg-white/70' style={{ top, left, width: size, height: size }} />
          ))}
          <div className='absolute -left-6 top-4 h-52 w-52 opacity-95 md:h-72 md:w-72'>
            <Moon id={'moon' + i} phase={s.phase} />
          </div>
          <div className='relative flex h-full flex-col items-start justify-end p-6 md:p-10'>
            <h2 className='font-display text-4xl leading-tight text-white md:text-6xl'>{s.title}</h2>
            <p className='mt-2 max-w-xs text-sm text-white/80 md:text-base'>{s.sub}</p>
            <Link href={s.href} className='mt-5 rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-ink'>{s.cta}</Link>
          </div>
        </div>
      ))}
    </section>
  );
}
