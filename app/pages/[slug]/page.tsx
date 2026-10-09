import { notFound } from 'next/navigation';

const pages: Record<string, string> = {
  'about-us': 'درباره ما',
  'contact-us': 'تماس با ما',
  faq: 'سوالات متداول',
  'return-policy': 'رویه بازگشت کالا',
  'terms-and-conditions': 'قوانین و مقررات',
};

export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export default async function InfoPage({ params }: Props) {
  const { slug } = await params;
  const title = pages[slug];
  if (!title) notFound();

  return (
    <article className='mt-6 max-w-3xl'>
      <h1 className='mb-4 text-2xl font-bold'>{title}</h1>
      <p className='text-ink/70'>متن این صفحه را اینجا بنویسید.</p>
    </article>
  );
}
