import type { MetadataRoute } from 'next';
import { categories } from '@/data/categories';
import { getProducts } from '@/lib/products';
import { absoluteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

const INFO_PAGES = ['about-us', 'contact-us', 'faq', 'return-policy', 'terms-and-conditions'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const list: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now },
    { url: absoluteUrl('/shop'), lastModified: now },
  ];

  // Categories and their sub-categories
  for (const c of categories) {
    list.push({ url: absoluteUrl('/shop?category=' + c.slug), lastModified: now });
    for (const x of c.children ?? []) {
      list.push({ url: absoluteUrl('/shop?category=' + x.slug), lastModified: now });
    }
  }

  for (const slug of INFO_PAGES) {
    list.push({ url: absoluteUrl('/pages/' + slug), lastModified: now });
  }

  // Products. If the database is unreachable the sitemap still answers with the pages above.
  try {
    const products = await getProducts();
    for (const p of products) {
      list.push({ url: absoluteUrl('/product/' + p.slug), lastModified: now });
    }
  } catch {
    // ignore
  }

  return list;
}
