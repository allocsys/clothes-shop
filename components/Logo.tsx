import { site } from '@/lib/site';

// Original MahPari mark: a crescent moon with a small sparkle.
export default function Logo({ light = false, uid = 'lg' }: { light?: boolean; uid?: string }) {
  const moon = light ? '#f6f3fb' : '#6b4fa0';
  return (
    <span className='inline-flex items-center gap-1.5 md:gap-2'>
      <svg viewBox='0 0 32 32' className='h-6 w-6 md:h-8 md:w-8' aria-hidden='true'>
        <defs>
          <mask id={uid + '-m'}>
            <rect width='32' height='32' fill='white' />
            <circle cx='21' cy='12' r='10' fill='black' />
          </mask>
        </defs>
        <circle cx='15' cy='16' r='12' fill={moon} mask={'url(#' + uid + '-m)'} />
        <path d='M25 19l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z' fill='#d9b36c' />
      </svg>
      <span className={'font-display text-2xl leading-none md:text-3xl ' + (light ? 'text-white' : 'text-brand')}>{site.name}</span>
    </span>
  );
}
