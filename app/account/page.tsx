import LoginForm from '@/components/LoginForm';
import LogoutButton from '@/components/LogoutButton';
import ProfileNameForm from '@/components/ProfileNameForm';
import { hasDb } from '@/lib/db';
import { getCurrentCustomer, type Customer } from '@/lib/auth/session';
import Link from 'next/link';
import AddressBook from '@/components/AddressBook';
import { listAddresses, type SavedAddress } from '@/lib/addresses';
import { listCustomerOrders, type HistoryOrder } from '@/lib/accountOrders';
import { STATUS_LABEL, isStatus } from '@/lib/orderStatus';
import { formatPrice } from '@/lib/format';
import { formatDateTime } from '@/lib/adminDate';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'حساب من', robots: { index: false, follow: false } };

export default async function AccountPage() {
  if (!hasDb()) return <p className='py-20 text-center text-ink/60'>حساب کاربری فعلاً در دسترس نیست.</p>;

  let customer: Customer | null = null;
  try {
    customer = await getCurrentCustomer();
  } catch (e) {
    console.error('ACCOUNT_SESSION_ERROR', e);
    return <p className='py-20 text-center text-ink/60'>حساب کاربری فعلاً در دسترس نیست. کمی بعد دوباره امتحان کنید.</p>;
  }

  if (!customer) {
    return (
      <section className='mx-auto mt-8 max-w-md'>
        <h1 className='text-xl font-bold'>ورود / ثبت‌نام</h1>
        <p className='mt-2 mb-5 text-sm leading-7 text-ink/60'>با شماره موبایل وارد شوید؛ برای ورود یک کد پیامکی برایتان می‌فرستیم. نیازی به رمز عبور نیست.</p>
        <LoginForm />
      </section>
    );
  }

  let orders: HistoryOrder[] | null = null;
  try {
    orders = await listCustomerOrders(customer.mobile);
  } catch (e) {
    console.error('ACCOUNT_ORDERS_ERROR', e);
  }

  let addresses: SavedAddress[] | null = null;
  try {
    addresses = await listAddresses(customer.id);
  } catch (e) {
    console.error('ACCOUNT_ADDRESSES_ERROR', e);
  }

  return (
    <section className='mx-auto mt-8 max-w-md space-y-5'>
      <h1 className='text-xl font-bold'>{customer.name ? 'سلام ' + customer.name : 'حساب من'}</h1>
      <div className='rounded-3xl bg-surface p-6'>
        <p className='text-sm text-ink/60'>شماره موبایل</p>
        <p className='mt-1 text-lg font-bold' dir='ltr'>{customer.mobile}</p>
        <ProfileNameForm initialName={customer.name} />
      </div>
      {addresses === null ? (
        <div className='rounded-3xl bg-surface p-6'>
          <h2 className='text-base font-bold'>آدرس‌های من</h2>
          <p className='mt-3 text-sm text-ink/60'>فعلاً نمی‌توانیم آدرس‌ها را نشان دهیم. کمی بعد دوباره امتحان کنید.</p>
        </div>
      ) : (
        <AddressBook initial={addresses} />
      )}
      <div className='rounded-3xl bg-surface p-6'>
        <h2 className='text-base font-bold'>سفارش‌های من</h2>
        {orders === null ? (
          <p className='mt-3 text-sm text-ink/60'>فعلاً نمی‌توانیم سفارش‌ها را نشان دهیم. کمی بعد دوباره امتحان کنید.</p>
        ) : orders.length === 0 ? (
          <p className='mt-3 text-sm leading-7 text-ink/60'>هنوز سفارشی با این شماره ثبت نشده است.</p>
        ) : (
          <ul className='mt-3 space-y-3'>
            {orders.map((o) => (
              <li key={o.code} className='rounded-2xl border border-ink/10 p-4'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='text-sm font-bold' dir='ltr'>{o.code}</span>
                  <span className='rounded-full bg-brand/10 px-3 py-1 text-xs text-brand'>{isStatus(o.status) ? STATUS_LABEL[o.status] : o.status}</span>
                </div>
                <p className='mt-1 text-xs text-ink/60'>{formatDateTime(o.createdAt)}</p>
                <ul className='mt-2 space-y-1 text-sm'>
                  {o.items.map((it, i) => (
                    <li key={i}>{it.title} <span className='text-ink/60'>({it.size}، {it.color}) × {it.qty.toLocaleString('fa-IR')}</span></li>
                  ))}
                </ul>
                <div className='mt-3 flex items-center justify-between text-sm'>
                  <span className='font-bold'>{formatPrice(o.total)}</span>
                  <span className='text-xs text-ink/60'>{o.status === 'canceled' ? '' : o.paymentStatus === 'paid' ? 'پرداخت‌شده' : 'پرداخت‌نشده'}</span>
                </div>
                <Link href={'/track?code=' + o.code} className='mt-2 inline-block text-xs text-brand underline'>پیگیری سفارش</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <LogoutButton />
    </section>
  );
}
