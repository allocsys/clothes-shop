# MahPari (ماه‌پری) — Build Plan

Persian RTL women's clothing shop. Next.js 15 + TypeScript + Tailwind 3, deployed on Railway (auto-deploy from `main`).
Live: https://clothes-shop-production-d9d8.up.railway.app

How we work: one step at a time. Finish a step, check it on the live site, tick the box, then start the next one.
Legend: `[x]` done, `[ ]` to do, `[?]` needs a decision from the owner first.

---

## Phase 0 — Foundation (done)
- [x] Next.js scaffold, RTL layout, Persian fonts (Vazirmatn + Aref Ruqaa)
- [x] Pages: home, shop, product, cart, account, info pages (`/pages/[slug]`)
- [x] Moonlit brand palette + logo
- [x] Glass (transparent, glossy) header buttons and mobile tab bar
- [x] Dark mode (CSS variable theme)
- [x] Slide-in mobile menu drawer
- [x] Cart: add to cart, quantities, totals, saved in browser
- [x] Checkout form + orders API (orders only logged, not stored)
- [x] Deployed on Railway, auto-deploy on push to `main`

## Phase 1 — Verify what we built
- [ ] Check the drawer menu, dark mode and cart on a real phone after deploy (see the five checks below)
- [x] Confirm the Railway build is green after the cart commits (live site serves cart, product and filter pages, 2026-10-09)
- [ ] Phone check 1: drawer menu (opens from right, tabs, accordion, login button, closes on X / outside tap)
- [ ] Phone check 2: dark mode (header, cards, chips, footer readable)
- [ ] Phone check 3: product page, pick size + color, add to cart, header badge updates
- [ ] Phone check 4: cart page and checkout form, place a test order, see confirmation
- [ ] Phone check 5: shop filter panel (size, color, price, sort, remove pills)
- [ ] Fix anything that looks wrong (send screenshots)

## Phase 2 — Shop experience
- [x] Filters on `/shop`: size, color, price range
- [x] Sorting: newest, cheapest, most expensive, biggest discount
- [x] Search results page that actually uses `?q=` (title match, removable pill)
- [x] Product page: image gallery (swipe on mobile, arrows + thumbnails on desktop; shows placeholder art until real photos exist via `images` in product data)
- [x] Product page: related products
- [x] Wishlist (heart on cards + product page, /wishlist page, header/tab count)

## Phase 3 — Real data
- [x] Decided (2026-10-09): women's clothing only for now; men's/kids can be added later as a new top-level category
- [x] Hosting decision (2026-10-09): Iranian VPS + Docker as the main target (Railway stays as test/staging)
- [x] Self-hosted fonts (no Google Fonts at build), Dockerfile, docker-compose + Caddy HTTPS, docs/DEPLOY_VPS.md
- [ ] Buy domain (.ir) + Iranian VPS (Ubuntu, 2 vCPU / 2-4 GB, Iran DC) and do first deploy using docs/DEPLOY_VPS.md
- [ ] Database: standard Postgres (container in docker-compose, named volume; same on Railway for testing) + scheduled backups. Tables: products, variants, stock, orders
- [ ] Replace placeholder products in `data/products.ts` with DB queries
- [ ] Real product photos with `next/image` (upload + storage)
- [ ] Stock tracking per size/color; "out of stock" state

## Phase 4 — Orders and payment
- [ ] Save orders in the database (replace the `NEW_ORDER` log line)
- [?] Decide: payment provider (Zarinpal or other)
- [ ] Payment gateway: start payment, callback, verify, mark order paid
- [?] Decide: shipping model (flat fee, by city, free above X). Currently placeholder in `lib/checkout.ts`
- [ ] Order status page: "track my order" by tracking code + phone
- [ ] Confirmation SMS or email

## Phase 5 — Accounts
- [?] Decide: SMS provider for OTP (e.g. Kavenegar, Melipayamak)
- [ ] Phone number + OTP login
- [ ] Account page: profile, saved addresses, order history

## Phase 6 — Admin panel
- [ ] Admin login (protected)
- [ ] Add / edit / hide products, prices, discounts, stock
- [ ] Orders list, change status, print packing slip
- [ ] Simple sales overview

## Phase 7 — Content and polish
- [ ] Real promo text, footer contacts and social links (TODOs in `lib/site.ts`, `components/Footer.tsx`)
- [ ] Real info pages: About, Contact, FAQ, Return policy, Terms
- [ ] Useful-links list in the mobile menu (`components/MobileMenu.tsx`)
- [ ] Empty states and error pages (404, 500) in brand style
- [ ] Accessibility pass (focus states, contrast in light and dark)

## Phase 8 — SEO and performance
- [ ] Per-page titles and descriptions
- [ ] `sitemap.xml`, `robots.txt`
- [ ] Product structured data (JSON-LD)
- [ ] Image optimization and Lighthouse pass on mobile

## Phase 9 — Launch
- [?] Decide: domain name
- [ ] Connect custom domain to Railway + HTTPS
- [ ] Delete leftover empty Railway project `mahpari-shop`
- [ ] Analytics
- [ ] Final end-to-end test: browse → cart → order → pay → admin sees it

---

## Open questions (owner)
1. Women's clothing only, or also men's and kids'?
2. Payment provider: Zarinpal or another?
3. Shipping: flat rate, by city, or free above a threshold (promo says free above 2,000,000 Toman)?
4. SMS provider for OTP login?
5. Domain name?

## Decisions already made
- Brand name: MahPari (ماه‌پری), moonlit purple/gold palette.
- Structure inspired by a reference shop; all brand, images and copy are original.
- Theme colors are CSS variables in `app/globals.css`; use `bg-surface` for cards, not `bg-white`.
- Fixed drawers must be portaled to `document.body` (the header's backdrop blur traps fixed children).

## Next step
Phase 1 phone checks (still waiting on screenshots), then Phase 3 (database, real photos).
