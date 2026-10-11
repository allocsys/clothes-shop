'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/components/Analytics';

// Renders nothing; records one search event (words searched + number of results) when the shop shows a search.
export default function SearchTrack({ q, results }: { q: string; results: number }) {
  useEffect(() => {
    trackEvent({ e: 'search', path: '/shop', query: q, results });
  }, [q, results]);
  return null;
}
