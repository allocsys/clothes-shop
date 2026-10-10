import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/cart', '/account', '/order/', '/pay/', '/track', '/wishlist'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
