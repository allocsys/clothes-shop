import Link from 'next/link';

export default function SectionHeading({ title, href }: { title: string; href?: string }) {
  return (
    <div className='mb-4'>
      <div className='flex items-center justify-between'>
        <h2 className='flex items-center gap-2 text-xl font-bold'>
          <span className='h-5 w-1.5 rounded-full bg-gold' />
          {title}
        </h2>
        {href && <Link href={href} className='inline-block py-2.5 text-sm text-brand'>مشاهده همه</Link>}
      </div>
      <span aria-hidden='true' className='block h-px bg-gradient-to-l from-gold/80 via-gold/30 to-transparent' />
    </div>
  );
}
