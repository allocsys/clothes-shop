import { GridSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <section className='mt-6' role='status' aria-busy='true'>
      <span className='sr-only'>در حال بارگذاری…</span>
      <div className='mb-5 flex gap-2 overflow-hidden' aria-hidden='true'>
        {[56, 72, 64, 80, 68].map((w, i) => (
          <div key={i} className='h-10 shrink-0 animate-pulse rounded-full bg-ink/10' style={{ width: w + 'px' }} />
        ))}
      </div>
      <div className='mb-4 h-7 w-40 animate-pulse rounded-xl bg-ink/10' aria-hidden='true' />
      <div className='mb-4 h-12 animate-pulse rounded-2xl bg-ink/10' aria-hidden='true' />
      <GridSkeleton count={8} />
    </section>
  );
}
