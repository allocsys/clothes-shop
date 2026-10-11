// Grey placeholder shapes shown while a page loads (used by loading.tsx files).
// Sizes mirror the real cards so nothing jumps when the content arrives.
const block = 'animate-pulse rounded-xl bg-ink/10';

export function CardSkeleton() {
  return (
    <div>
      <div className={block + ' aspect-[3/4] rounded-2xl'} />
      <div className={block + ' mt-2 h-4 w-3/4'} />
      <div className={block + ' mt-2 h-4 w-1/2'} />
      <div className={block + ' mt-2 h-3 w-1/3'} />
    </div>
  );
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className='grid grid-cols-2 gap-4 md:grid-cols-4' aria-hidden='true'>
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
