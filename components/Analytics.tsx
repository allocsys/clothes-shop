'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Sends a page view (and a product view on product pages) to our own /api/a. No cookie, nothing stored in the browser.
// The referrer and utm_* values go only with the first page of a visit, so later in-site clicks do not count as new sources.
function send(payload: Record<string, unknown>) {
  try {
    const data = JSON.stringify(payload);
    if (navigator.sendBeacon && navigator.sendBeacon('/api/a', data)) return;
    fetch('/api/a', { method: 'POST', body: data, keepalive: true }).catch(() => {});
  } catch {
    /* tracking must never break the page */
  }
}

export default function Analytics() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    const extra: Record<string, unknown> = {};
    if (first.current) {
      first.current = false;
      extra.ref = document.referrer || '';
      const q = new URLSearchParams(window.location.search);
      for (const k of ['utm_source', 'utm_medium', 'utm_campaign']) {
        const v = q.get(k);
        if (v) extra[k] = v;
      }
    }
    send({ e: 'pageview', path: pathname, ...extra });
    const m = /^\/product\/([^/]+)/.exec(pathname);
    if (m) send({ e: 'product_view', path: pathname, slug: decodeURIComponent(m[1]) });
  }, [pathname]);

  return null;
}
