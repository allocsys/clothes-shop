import LoginForm from '@/components/LoginForm';
import LogoutButton from '@/components/LogoutButton';
import ProfileNameForm from '@/components/ProfileNameForm';
import { hasDb } from '@/lib/db';
import { getCurrentCustomer, type Customer } from '@/lib/auth/session';

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

  return (
    <section className='mx-auto mt-8 max-w-md space-y-5'>
      <h1 className='text-xl font-bold'>{customer.name ? 'سلام ' + customer.name : 'حساب من'}</h1>
      <div className='rounded-3xl bg-surface p-6'>
        <p className='text-sm text-ink/60'>شماره موبایل</p>
        <p className='mt-1 text-lg font-bold' dir='ltr'>{customer.mobile}</p>
        <ProfileNameForm initialName={customer.name} />
      </div>
      <LogoutButton />
    </section>
  );
}
