export type Product = {
  slug: string;
  title: string;
  price: number;
  oldPrice?: number;
  category: string;
  sizes: string[];
  colors: string[];
  description: string;
  images?: string[]; // photo URLs (first one is the main photo)
};

// Placeholder products. Replace with real data or a database later.
export const products: Product[] = [
  { slug: 'sample-manteau-1', title: 'مانتو نمونه ۱', price: 1850000, oldPrice: 2200000, category: 'manteau', sizes: ['S', 'M', 'L'], colors: ['مشکی', 'کرم'], description: 'توضیحات نمونه محصول.' },
  { slug: 'sample-blouse-1', title: 'شومیز نمونه ۱', price: 990000, category: 'blouse', sizes: ['M', 'L'], colors: ['سفید', 'سبز'], description: 'توضیحات نمونه محصول.' },
  { slug: 'sample-tshirt-1', title: 'تی‌شرت نمونه ۱', price: 450000, category: 'tshirt', sizes: ['S', 'M', 'L', 'XL'], colors: ['سفید', 'مشکی'], description: 'توضیحات نمونه محصول.' },
  { slug: 'sample-dress-1', title: 'پیراهن نمونه ۱', price: 1650000, category: 'dress', sizes: ['S', 'M'], colors: ['زرشکی'], description: 'توضیحات نمونه محصول.' },
  { slug: 'sample-trousers-1', title: 'شلوار نمونه ۱', price: 1200000, category: 'trousers', sizes: ['M', 'L', 'XL'], colors: ['مشکی', 'طوسی'], description: 'توضیحات نمونه محصول.' },
  { slug: 'sample-skirt-1', title: 'دامن نمونه ۱', price: 870000, category: 'skirt', sizes: ['S', 'M', 'L'], colors: ['کرم'], description: 'توضیحات نمونه محصول.' },
  { slug: 'sample-set-1', title: 'ست نمونه ۱', price: 2400000, oldPrice: 2900000, category: 'set', sizes: ['M', 'L'], colors: ['سرمه‌ای'], description: 'توضیحات نمونه محصول.' },
  { slug: 'sample-scarf-1', title: 'شال نمونه ۱', price: 320000, category: 'accessories', sizes: ['Free'], colors: ['طرح‌دار'], description: 'توضیحات نمونه محصول.' },
];
