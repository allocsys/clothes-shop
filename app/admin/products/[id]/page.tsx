import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductEditForm from '@/components/admin/ProductEditForm';
import VariantsEditor from '@/components/admin/VariantsEditor';
import { listVariants } from '@/lib/adminVariants';
import { getAdminProduct } from '@/lib/adminProducts';
import { hasDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!hasDb() || !Number.isInteger(id) || id <= 0) notFound();
  const product = await getAdminProduct(id);
  if (!product) notFound();
  const variants = await listVariants(id);

  return (
    <div>
      <Link href='/admin/products' className='text-sm text-brand'>← محصولات</Link>
      <h1 className='mt-3 text-xl font-bold'>ویرایش محصول</h1>
      <p className='mt-1 text-xs text-ink/50' dir='ltr'>/product/{product.slug}</p>
      <ProductEditForm product={product} />
      <VariantsEditor productId={product.id} initial={variants} />
    </div>
  );
}
