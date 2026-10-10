import { categoryOptions } from '@/data/categories';
import { db } from '@/lib/db';

// Product data for the admin panel: ALL products (hidden ones too), with stock totals.
// Needs the database; the shop-facing reads live in lib/products.ts.

export type AdminProductRow = {
  id: number;
  slug: string;
  title: string;
  category: string;
  price: number;
  oldPrice: number | null;
  image: string | null; // main photo key
  isActive: boolean; // false = hidden from the shop
  variantCount: number;
  totalStock: number;
};

type Row = {
  id: number;
  slug: string;
  title: string;
  category: string;
  price: number;
  old_price: number | null;
  image: string | null;
  is_active: boolean;
  variant_count: number;
  total_stock: number;
};

export async function listAdminProducts(): Promise<AdminProductRow[]> {
  const { rows } = await db().query<Row>(`
    SELECT p.id, p.slug, p.title, p.category, p.price, p.old_price,
           p.images[1] AS image, p.is_active,
           COUNT(v.id)::int AS variant_count,
           COALESCE(SUM(v.stock), 0)::int AS total_stock
    FROM products p
    LEFT JOIN variants v ON v.product_id = p.id
    GROUP BY p.id
    ORDER BY p.id DESC`);
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    category: r.category,
    price: r.price,
    oldPrice: r.old_price,
    image: r.image,
    isActive: r.is_active,
    variantCount: r.variant_count,
    totalStock: r.total_stock,
  }));
}

// ---- One product, for the edit page ----

export type AdminProduct = {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  price: number;
  oldPrice: number | null;
  isActive: boolean;
};

type OneRow = Omit<Row, 'image' | 'variant_count' | 'total_stock'> & { description: string };

function toAdminProduct(r: OneRow): AdminProduct {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    category: r.category,
    price: r.price,
    oldPrice: r.old_price,
    isActive: r.is_active,
  };
}

export async function getAdminProduct(id: number): Promise<AdminProduct | null> {
  const { rows } = await db().query<OneRow>(
    'SELECT id, slug, title, description, category, price, old_price, is_active FROM products WHERE id = $1',
    [id],
  );
  return rows[0] ? toAdminProduct(rows[0]) : null;
}

// ---- Editing the basics (title, description, category, price, discount, visibility) ----

export type BasicsInput = {
  title: string;
  description: string;
  category: string;
  price: number;
  oldPrice: number | null;
  isActive: boolean;
};

export type BasicsErrors = Partial<Record<keyof BasicsInput, string>>;

const MAX_PRICE = 1_000_000_000; // toman

export function validateBasics(raw: unknown): { ok: true; value: BasicsInput } | { ok: false; errors: BasicsErrors } {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const errors: BasicsErrors = {};

  const title = typeof r.title === 'string' ? r.title.trim() : '';
  if (!title) errors.title = 'نام محصول را وارد کنید.';
  else if (title.length > 120) errors.title = 'نام محصول حداکثر ۱۲۰ حرف باشد.';

  const description = typeof r.description === 'string' ? r.description.trim() : '';
  if (description.length > 3000) errors.description = 'توضیحات حداکثر ۳۰۰۰ حرف باشد.';

  const category = typeof r.category === 'string' ? r.category : '';
  if (!categoryOptions().some((c) => c.slug === category)) errors.category = 'دسته‌بندی معتبر نیست.';

  const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
  const price = r.price;
  if (!isInt(price) || price < 0 || price > MAX_PRICE) errors.price = 'قیمت را به تومان و به صورت عدد صحیح وارد کنید.';

  let oldPrice: number | null = null;
  if (r.oldPrice !== null && r.oldPrice !== undefined) {
    if (!isInt(r.oldPrice) || r.oldPrice > MAX_PRICE) errors.oldPrice = 'قیمت قبل از تخفیف باید عدد صحیح باشد.';
    else if (isInt(price) && r.oldPrice <= price) errors.oldPrice = 'قیمت قبل از تخفیف باید از قیمت فعلی بیشتر باشد.';
    else oldPrice = r.oldPrice;
  }

  const isActive = r.isActive;
  if (typeof isActive !== 'boolean') errors.isActive = 'وضعیت نمایش معتبر نیست.';

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { title, description, category, price: price as number, oldPrice, isActive: isActive as boolean } };
}

export async function updateProductBasics(id: number, v: BasicsInput): Promise<AdminProduct | null> {
  const { rows } = await db().query<OneRow>(
    `UPDATE products
        SET title = $2, description = $3, category = $4, price = $5, old_price = $6, is_active = $7, updated_at = now()
      WHERE id = $1
  RETURNING id, slug, title, description, category, price, old_price, is_active`,
    [id, v.title, v.description, v.category, v.price, v.oldPrice, v.isActive],
  );
  return rows[0] ? toAdminProduct(rows[0]) : null;
}
