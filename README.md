# clothes-shop

An original Persian (RTL) online clothing shop, built with Next.js, TypeScript and Tailwind CSS.

Status: front-end scaffold with placeholder data. No payments or database yet.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Structure

```
app/            routes (home, shop, product, cart, account, pages/[slug])
components/     Header, Footer, MobileTabBar, ProductCard
data/           categories and placeholder products
lib/            site config (name, tagline) and price formatting
docs/           site map notes
```

## Make it yours

1. Edit `lib/site.ts` (shop name, tagline, promo text)
2. Edit `tailwind.config.ts` colors
3. Edit `data/categories.ts` and `data/products.ts`
4. Add real photos under `public/` and use `next/image` in `components/ProductCard.tsx`

## Roadmap

- [ ] Cart state and checkout form
- [ ] Phone and OTP login (needs an SMS provider)
- [ ] Product filters (size, color, price range)
- [ ] Database and admin panel for products and orders
- [ ] Payment gateway
- [ ] SEO: sitemap, structured data

See `docs/SITE_MAP.md` for the page map this scaffold follows.
