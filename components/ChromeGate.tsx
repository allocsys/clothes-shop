'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

// Hides the shop chrome (header, footer, tab bar) on admin pages. The children are still
// rendered on the server; this only decides whether to show them.
export default function ChromeGate({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (path === '/admin' || path.startsWith('/admin/')) return null;
  return <>{children}</>;
}
