import LoginForm from '@/components/admin/LoginForm';

export default function AdminLoginPage() {
  return (
    <div className='mx-auto max-w-sm rounded-3xl bg-surface p-6'>
      <h1 className='text-xl font-bold'>ورود به پنل مدیریت</h1>
      <LoginForm />
    </div>
  );
}
