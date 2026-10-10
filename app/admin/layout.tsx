import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// The admin area must never show up in search engines.
export const metadata: Metadata = {
  title: 'پنل مدیریت',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className='mx-auto max-w-3xl pt-8'>{children}</div>;
}
