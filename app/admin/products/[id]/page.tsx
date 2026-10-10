import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductEditForm from '@/components/admin/ProductEditForm';
import PhotoManager from '@/components/admin/PhotoManager';
import VariantsEditor from '@/components/admin/VariantsEditor';
import { getPhotoKeys } from '@/lib/adminPhotos';
import { listVariants } from '@/lib/adminVariants';
import { getAdminProduct } from '@/lib/adminProducts';
import { hasDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminProductEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const justCreated = (await searchParams).new === '1';
  const id = Number((await params).id);
  if (!hasDb() || !Number.isInteger(id) || id <= 0) notFound();
  const product = await getAdminProduct(id);
  if (!product) notFound();
  const variants = await listVariants(id);
  const photos = (await getPhotoKeys(id)) ?? [];

  return (
    <div>
      <Link href='/admin/products' className='text-sm text-brand'>← محصولات</Link>
      <h1 className='mt-3 text-xl font-bold'>ویرایش محصول</h1>
      {justCreated && (
        <p className='mt-3 rounded-2xl bg-brand/10 p-3 text-sm text-brand'>
          محصول ساخته شد. حالا پایین صفحه عکس‌ها را اضافه کنید{product.isActive ? '.' : '، و بعد «نمایش در فروشگاه» را روشن کنید.'}
        </p>
      )}
      <p className='mt-1 text-xs text-ink/50' dir='ltr'>/product/{product.slug}</p>
      <ProductEditForm product={product} />
      <PhotoManager productId={product.id} category={product.category} slug={product.slug} title={product.title} initial={photos} />
      <VariantsEditor productId={product.id} initial={variants} />
    </div>
  );
}
