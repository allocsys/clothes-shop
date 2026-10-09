'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type WishlistValue = {
  slugs: string[];
  ready: boolean;
  count: number;
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
};

const STORAGE_KEY = 'mahpari-wishlist-v1';
const WishlistContext = createContext<WishlistValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSlugs(parsed.filter((s) => typeof s === 'string'));
      }
    } catch {
      /* ignore corrupt or unavailable storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
    } catch {
      /* storage may be full or blocked */
    }
  }, [slugs, ready]);

  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);
  const toggle = useCallback((slug: string) => {
    setSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [slug, ...prev]));
  }, []);

  const value = useMemo<WishlistValue>(() => ({ slugs, ready, count: slugs.length, has, toggle }), [slugs, ready, has, toggle]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>');
  return ctx;
}
