'use client';

import { useEffect, useState } from 'react';
import type { Product } from '@/data/products';

// Loads product data (price, sizes, colors...) for the given slugs from /api/products.
// Used by the cart and wishlist, which live in the browser and only know slugs.
export function useProducts(slugs: string[]) {
  const key = Array.from(new Set(slugs)).sort().join(',');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!key) {
      setProducts([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch('/api/products?slugs=' + encodeURIComponent(key))
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setProducts(Array.isArray(d.products) ? d.products : []);
      })
      .catch(() => {
        /* keep what we had; the page shows the empty state */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { products, loading };
}
