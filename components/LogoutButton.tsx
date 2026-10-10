'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.refresh();
      setBusy(false);
    }
  }

  return (
    <button type='button' onClick={logout} disabled={busy} className='rounded-2xl border border-ink/15 px-5 py-2.5 text-sm font-bold disabled:opacity-50'>
      {busy ? 'در حال خروج…' : 'خروج از حساب'}
    </button>
  );
}
