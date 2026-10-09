import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileTabBar from '@/components/MobileTabBar';
import { site } from '@/lib/site';

const font = Vazirmatn({ subsets: ['arabic', 'latin'], display: 'swap' });

export const metadata: Metadata = {
  title: { default: site.name, template: '%s | ' + site.name },
  description: site.tagline,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='fa' dir='rtl'>
      <body className={font.className + ' bg-sand text-ink antialiased'}>
        <Header />
        <main className='mx-auto min-h-[60vh] max-w-7xl px-4 pb-24 md:pb-10'>{children}</main>
        <Footer />
        <MobileTabBar />
      </body>
    </html>
  );
}
