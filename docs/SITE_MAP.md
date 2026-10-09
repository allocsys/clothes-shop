# Reference site map (summary)

Full write-up lives in the project doc: https://claude.ai/code/artifact/80ebff2b-6da5-4dfd-8d6a-f11b2a10523b

We studied the structure of a typical Persian women's-fashion WooCommerce store to decide which pages and sections to build. Only structure and layout patterns are used. Brand, images and copy in this repo are original placeholders.

## Routes in this scaffold

| Route | Purpose | Status |
|---|---|---|
| `/` | Home: hero, categories, new arrivals | Scaffolded |
| `/shop` | Listing with category, search and price sort | Scaffolded |
| `/product/[slug]` | Product page with size and color | Scaffolded (no cart yet) |
| `/cart` | Cart and checkout | Placeholder |
| `/account` | Phone and OTP login | Placeholder |
| `/pages/[slug]` | About, contact, FAQ, return policy, terms | Placeholder text |

## Layout patterns kept

- Promo bar, header with search, login and cart, category nav
- Hero, category tiles, product sections
- Mobile: fixed bottom tab bar
- Footer with link groups and contact block
