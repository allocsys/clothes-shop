import CartView from '@/components/CartView';

export const metadata = { robots: { index: false, follow: false }, title: 'سبد خرید' };

export default function CartPage() {
  return <CartView />;
}
