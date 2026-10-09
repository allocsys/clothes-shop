import { products as staticProducts } from '@/data/products';
import type { Product } from '@/data/products';
import { db, hasDb } from './db';

export type { Product };

// Data layer for products.
// - With DATABASE_URL set: reads Postgres (only active products).
// - Without it (e.g. Railway staging today): falls back to data/products.ts.
// Pages that use this must be dynamic (export const dynamic = 'force-dynamic'),
// otherwise Next would freeze the data at build time.

type Row = {
  slug: string;
  title: string;
  description: string;
  category: string;
  price: number;
  old_price: number | null;
  images: string[];
  variants: { size: string; color: string }[];
};

const SELECT = `
  SELECT p.slug, p.title, p.description, p.category, p.price, p.old_price, p.images,
         COALESCE(
           json_agg(json_build_object('size', v.size, 'color', v.color) ORDER BY v.id)
             FILTER (WHERE v.id IS NOT NULL),
           '[]'
         ) AS variants
  FROM products p
  LEFT JOIN variants v ON v.product_id = p.id
  WHERE p.is_active`;

function unique(list: string[]): string[] {
  return Array.from(new Set(list));
}

function toProduct(r: Row): Product {
  return {
    slug: r.slug,
    title: r.title,
    description: r.description,
    category: r.category,
    price: r.price,
    ...(r.old_price != null ? { oldPrice: r.old_price } : {}),
    sizes: unique(r.variants.map((v) => v.size)),
    colors: unique(r.variants.map((v) => v.color)),
    ...(r.images.length ? { images: r.images } : {}),
  };
}

export async function getProducts(): Promise<Product[]> {
  if (!hasDb()) return staticProducts;
  const { rows } = await db().query<Row>(`${SELECT} GROUP BY p.id ORDER BY p.id`);
  return rows.map(toProduct);
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  if (!hasDb()) return staticProducts.find((p) => p.slug === slug);
  const { rows } = await db().query<Row>(`${SELECT} AND p.slug = $1 GROUP BY p.id`, [slug]);
  return rows[0] ? toProduct(rows[0]) : undefined;
}

export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  if (!slugs.length) return [];
  if (!hasDb()) return staticProducts.filter((p) => slugs.includes(p.slug));
  const { rows } = await db().query<Row>(
    `${SELECT} AND p.slug = ANY($1::text[]) GROUP BY p.id ORDER BY p.id`,
    [slugs],
  );
  return rows.map(toProduct);
}
