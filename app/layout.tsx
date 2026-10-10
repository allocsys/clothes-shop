import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@fontsource-variable/vazirmatn';
import '@fontsource/aref-ruqaa/400.css';
import '@fontsource/aref-ruqaa/700.css';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileTabBar from '@/components/MobileTabBar';
import ChromeGate from '@/components/ChromeGate';
import { CartProvider } from '@/components/CartProvider';
import { WishlistProvider } from '@/components/WishlistProvider';
import { AccountProvider } from '@/components/AccountProvider';
import { site } from '@/lib/site';

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
    <html lang='fa' dir='rtl'>
      <body className='bg-sand font-sans text-ink antialiased'>
        <a
          href='#main'
          className='sr-only focus:not-sr-only focus:fixed focus:right-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-night focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white'
        >
          پرش به محتوای صفحه
        </a>
        <AccountProvider>
        <CartProvider>
        <WishlistProvider>
          <ChromeGate><Header /></ChromeGate>
        <main id='main' tabIndex={-1} className='mx-auto min-h-[60vh] max-w-7xl px-4 pb-6 focus-visible:outline-none md:pb-10'>{children}</main>
        <ChromeGate><Footer /></ChromeGate>
        <ChromeGate><MobileTabBar /></ChromeGate>
        </WishlistProvider>
        </CartProvider>
        </AccountProvider>
      </body>
    </html>
  );
}
