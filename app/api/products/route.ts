import { NextResponse } from 'next/server';
import { getProductsBySlugs } from '@/lib/products';

export const dynamic = 'force-dynamic';

// GET /api/products?slugs=a,b,c  -> the listed products (used by cart and wishlist in the browser)
export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get('slugs') ?? '';
  const slugs = Array.from(new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))).slice(0, 50);
  const products = await getProductsBySlugs(slugs);
  return NextResponse.json({ products });
}
