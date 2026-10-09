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
