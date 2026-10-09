import Link from 'next/link';

export default function SectionHeading({ title, href }: { title: string; href?: string }) {
  return (
    <div className='mb-4 flex items-center justify-between'>
      <h2 className='flex items-center gap-2 text-xl font-bold'>
        <span className='h-5 w-1.5 rounded-full bg-gold' />
        {title}
      </h2>
      {href && <Link href={href} className='text-sm text-brand'>مشاهده همه</Link>}
    </div>
  );
}
