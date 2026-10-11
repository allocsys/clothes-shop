import { ProductPageSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <div role='status' aria-busy='true'>
      <span className='sr-only'>در حال بارگذاری…</span>
      <ProductPageSkeleton />
    </div>
  );
}
