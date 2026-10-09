export type Category = {
  slug: string;
  title: string;
  children?: Category[];
};

// Two-level category tree. Edit freely.
export const categories: Category[] = [
  { slug: 'manteau', title: 'مانتو' },
  { slug: 'blouse', title: 'شومیز و بلوز' },
  { slug: 'tshirt', title: 'تی‌شرت', children: [{ slug: 'crop', title: 'کراپ' }] },
  { slug: 'dress', title: 'پیراهن و سارافون' },
  {
    slug: 'bottoms',
    title: 'شلوار و دامن',
    children: [
      { slug: 'trousers', title: 'شلوار' },
      { slug: 'skirt', title: 'دامن' },
    ],
  },
  { slug: 'set', title: 'ست' },
  { slug: 'accessories', title: 'اکسسوری' },
];

// A category plus all of its sub-categories (used for filtering products).
export function categorySlugs(slug: string): string[] {
  const walk = (list: Category[]): string[] =>
    list.flatMap((c) => {
      if (c.slug === slug) return [c.slug, ...(c.children ?? []).flatMap((x) => [x.slug])];
      return walk(c.children ?? []);
    });
  const found = walk(categories);
  return found.length ? found : [slug];
}
