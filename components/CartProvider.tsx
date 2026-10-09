'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type CartLine = { slug: string; size: string; color: string; qty: number };
export type CartKey = Pick<CartLine, 'slug' | 'size' | 'color'>;

type CartContextValue = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  add: (key: CartKey, qty?: number) => void;
  setQty: (key: CartKey, qty: number) => void;
  remove: (key: CartKey) => void;
  clear: () => void;
};

const STORAGE_KEY = 'mahpari-cart-v1';
const MAX_QTY = 10;

const same = (a: CartKey, b: CartKey) => a.slug === b.slug && a.size === b.size && a.color === b.color;

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  // Load once on the client
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLines(parsed.filter((l) => l && l.slug && l.qty > 0));
      }
    } catch {
      /* ignore corrupt or unavailable storage */
    }
    setReady(true);
  }, []);

  // Persist after the first load
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage may be full or blocked */
    }
  }, [lines, ready]);

  const add = useCallback((key: CartKey, qty = 1) => {
    setLines((prev) => {
      const found = prev.find((l) => same(l, key));
      if (found) return prev.map((l) => (same(l, key) ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l));
      return [...prev, { ...key, qty: Math.min(MAX_QTY, qty) }];
    });
  }, []);

  const setQty = useCallback((key: CartKey, qty: number) => {
    setLines((prev) =>
      qty <= 0 ? prev.filter((l) => !same(l, key)) : prev.map((l) => (same(l, key) ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)),
    );
  }, []);

  const remove = useCallback((key: CartKey) => setLines((prev) => prev.filter((l) => !same(l, key))), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({ lines, ready, count: lines.reduce((n, l) => n + l.qty, 0), add, setQty, remove, clear }),
    [lines, ready, add, setQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}

export { MAX_QTY };
