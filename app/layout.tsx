import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Vazirmatn, Aref_Ruqaa } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileTabBar from '@/components/MobileTabBar';
import { CartProvider } from '@/components/CartProvider';
import { WishlistProvider } from '@/components/WishlistProvider';
import { site } from '@/lib/site';

const body = Vazirmatn({ subsets: ['arabic', 'latin'], display: 'swap', variable: '--font-body' });
const display = Aref_Ruqaa({ subsets: ['arabic', 'latin'], weight: ['400', '700'], display: 'swap', variable: '--font-display' });

export const metadata: Metadata = {
  title: { default: site.name + ' | ' + site.tagline, template: '%s | ' + site.name },
  description: site.tagline,
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#241a47' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0b22' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='fa' dir='rtl' className={body.variable + ' ' + display.variable}>
      <body className='bg-sand font-sans text-ink antialiased'>
        <CartProvider>
        <WishlistProvider>
          <Header />
        <main className='mx-auto min-h-[60vh] max-w-7xl px-4 pb-6 md:pb-10'>{children}</main>
        <Footer />
        <MobileTabBar />
        </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
