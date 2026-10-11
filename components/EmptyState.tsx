import Link from 'next/link';
import type { ReactNode } from 'react';

// One look for every "nothing here yet" screen: round icon, title, hint, one button.
// `as='h1'` for pages that have no other heading (cart, wishlist); `as='p'` when a heading sits above.
export default function EmptyState({
  icon,
  title,
  hint,
  href,
  action,
  as = 'p',
  compact,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  href: string;
  action: string;
  as?: 'h1' | 'p';
  compact?: boolean;
}) {
  const Title = as;
  return (
    <div className={'mx-auto flex max-w-sm flex-col items-center text-center ' + (compact ? 'py-10' : 'py-16')}>
      <div className='grid h-20 w-20 place-items-center rounded-full bg-brand/10 text-brand ring-8 ring-brand/5'>{icon}</div>
      <Title className='mt-5 text-base font-bold text-ink'>{title}</Title>
      {hint && <p className='mt-1.5 text-xs leading-6 text-ink/70'>{hint}</p>}
      <Link href={href} className='mt-5 inline-block rounded-full bg-brand px-8 py-3 text-sm font-bold text-white'>{action}</Link>
    </div>
  );
}
