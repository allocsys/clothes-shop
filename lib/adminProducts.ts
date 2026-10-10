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
