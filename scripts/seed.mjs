// Puts the 8 sample products into an empty database (placeholder stock: 5 per size/color).
// Existing products are left alone. Real products will be added from the admin panel later.
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const samples = [
  { slug: 'sample-manteau-1', title: 'مانتو نمونه ۱', price: 1850000, oldPrice: 2200000, category: 'manteau', sizes: ['S', 'M', 'L'], colors: ['مشکی', 'کرم'] },
  { slug: 'sample-blouse-1', title: 'شومیز نمونه ۱', price: 990000, category: 'blouse', sizes: ['M', 'L'], colors: ['سفید', 'سبز'] },
  { slug: 'sample-tshirt-1', title: 'تی‌شرت نمونه ۱', price: 450000, category: 'tshirt', sizes: ['S', 'M', 'L', 'XL'], colors: ['سفید', 'مشکی'] },
  { slug: 'sample-dress-1', title: 'پیراهن نمونه ۱', price: 1650000, category: 'dress', sizes: ['S', 'M'], colors: ['زرشکی'] },
  { slug: 'sample-trousers-1', title: 'شلوار نمونه ۱', price: 1200000, category: 'trousers', sizes: ['M', 'L', 'XL'], colors: ['مشکی', 'طوسی'] },
  { slug: 'sample-skirt-1', title: 'دامن نمونه ۱', price: 870000, category: 'skirt', sizes: ['S', 'M', 'L'], colors: ['کرم'] },
  { slug: 'sample-set-1', title: 'ست نمونه ۱', price: 2400000, oldPrice: 2900000, category: 'set', sizes: ['M', 'L'], colors: ['سرمه‌ای'] },
  { slug: 'sample-scarf-1', title: 'شال نمونه ۱', price: 320000, category: 'accessories', sizes: ['Free'], colors: ['طرح‌دار'] },
];

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query('BEGIN');
  let added = 0;
  for (const p of samples) {
    const res = await client.query(
      'INSERT INTO products (slug, title, description, category, price, old_price) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (slug) DO NOTHING RETURNING id',
      [p.slug, p.title, 'توضیحات نمونه محصول.', p.category, p.price, p.oldPrice ?? null],
    );
    if (res.rowCount === 0) continue;
    added++;
    for (const size of p.sizes) {
      for (const color of p.colors) {
        await client.query('INSERT INTO variants (product_id, size, color, stock) VALUES ($1, $2, $3, 5)', [res.rows[0].id, size, color]);
      }
    }
  }
  await client.query('COMMIT');
  console.log('Seed done: ' + added + ' new product(s), ' + (samples.length - added) + ' already existed.');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  await client.end();
}
