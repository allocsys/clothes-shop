'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }
  return (
    <button type='button' onClick={logout} className='rounded-full border border-ink/20 px-4 py-1.5 text-sm'>
      خروج
    </button>
  );
}
