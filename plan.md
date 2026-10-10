# MahPari (ماه‌پری) — Build Plan

Persian RTL women's clothing shop. Next.js 15 + TypeScript + Tailwind 3, deployed on Railway (auto-deploy from `main`).
Live: https://clothes-shop-production-d9d8.up.railway.app

How we work: one step at a time. Finish a step, check it on the live site, tick the box, then start the next one.
Legend: `[x]` done, `[ ]` to do, `[?]` needs a decision from the owner first.
Last updated: 2026-10-10 (evening). Right now: Phase 6, next task = simple sales overview in the admin.

---

## Phase 0 — Foundation (done)
- [x] Next.js scaffold, RTL layout, Persian fonts (Vazirmatn + Aref Ruqaa)
- [x] Pages: home, shop, product, cart, account, info pages (`/pages/[slug]`)
- [x] Moonlit brand palette + logo
- [x] Glass (transparent, glossy) header buttons and mobile tab bar
- [x] Dark mode (CSS variable theme)
- [x] Slide-in mobile menu drawer
- [x] Cart: add to cart, quantities, totals, saved in browser
- [x] Checkout form + orders API (first version only logged orders; they are saved in the database since Phase 4)
- [x] Deployed on Railway, auto-deploy on push to `main`

## Phase 1 — Verify what we built
- [ ] Check the drawer menu, dark mode and cart on a real phone after deploy (see the five checks below)
- [x] Confirm the Railway build is green after the cart commits (live site serves cart, product and filter pages, 2026-10-09)
- [ ] Phone check 1: drawer menu (opens from right, tabs, accordion, login button, closes on X / outside tap)
- [ ] Phone check 2: dark mode (header, cards, chips, footer readable)
- [x] Phone check 3: product page, pick size + color, add to cart, header badge updates (confirmed 2026-10-10)
- [x] Phone check 4: cart page and checkout form, place a test order, see confirmation (confirmed 2026-10-10)
- [ ] Phone check 5: shop filter panel (size, color, price, sort, remove pills)
- [ ] Fix anything that looks wrong (send screenshots)

## Phase 2 — Shop experience
- [x] Filters on `/shop`: size, color, price range
- [x] Sorting: newest, cheapest, most expensive, biggest discount
- [x] Search results page that actually uses `?q=` (title match, removable pill)
- [x] Product page: image gallery (swipe on mobile, arrows + thumbnails on desktop; shows placeholder art until real photos exist via `images` in product data)
- [x] Product page: related products
- [x] Wishlist (heart on cards + product page, /wishlist page, header/tab count)
- [x] Add-to-cart animation v2 (2026-10-10): the product's own garment drawing (shirt, pants, dress, coat, set, scarf; `lib/garments.ts`) pops up above the button, folds in half sideways, folds in half upward, then flies to the header cart icon; the icon bounces and a short "+۱" pops (`lib/cartAnimation.ts`, `components/CartFeedback.tsx`). Ignores reduced motion on purpose. Tested in headless mobile Chromium; waiting for a phone check
- [ ] Phone check: add-to-cart fold-and-fly (v2). Note: the first phone test of v1 showed only the "+۱" because the phone had reduced motion on; v2 ignores that setting

## Phase 3 — Real data
- [x] Decided (2026-10-09): women's clothing only for now; men's/kids can be added later as a new top-level category
- [x] Hosting decision (2026-10-09): Iranian VPS + Docker as the main target (Railway stays as test/staging)
- [x] Self-hosted fonts (no Google Fonts at build), Dockerfile, docker-compose + Caddy HTTPS, docs/DEPLOY_VPS.md
- [ ] Off-server database backups: the Railway Postgres volume is only 500 MB and has no backup set up (on the VPS `scripts/backup.sh` covers the database and photos; copy the files off the server too)
- [ ] Buy domain (.ir) + Iranian VPS (Ubuntu, 2 vCPU / 2-4 GB, Iran DC) and do first deploy using docs/DEPLOY_VPS.md
- [x] Database foundation: Postgres schema (products, variants with stock, orders, order_items), `lib/db.ts`, migrate + seed scripts, compose db service, backup script (tested on Postgres 16)
- [x] Railway: Postgres service added to `diligent-enthusiasm` / production (2026-10-09) and `DATABASE_URL` on `clothes-shop` set to `${{Postgres.DATABASE_URL}}`; it takes effect on the next deploy (this push)
- [x] Railway: tables and 8 sample products created; site reads them from Postgres (confirmed on phone, 2026-10-10). Pre-deploy command now runs migrate only (`node scripts/migrate.mjs`); `node scripts/setup.mjs` = migrate + seed, run by hand or temporarily on a fresh database
- [x] Replace placeholder products with DB queries: `lib/products.ts` reads Postgres when `DATABASE_URL` is set, else falls back to `data/products.ts`; home, shop, product page, cart, wishlist, orders API all use it (tested on real Postgres, 2026-10-09)
- [ ] Real product photos with `next/image` (upload + storage). Decided 2026-10-10: server disk now, code ready for ArvanCloud:
  - [x] Photos shown through `next/image` in the product page, cards and cart, drawing as fallback (`components/ProductImage.tsx`, `lib/media.ts`); DB stores keys like `products/abc.jpg`
  - [x] Storage layer `lib/storage.ts` (disk driver, safe keys) + `/media/<key>` route; tested incl. bad paths and the image optimizer in the standalone build
  - [x] Docker: `uploads` volume, writable `/uploads`, photo backup in `scripts/backup.sh`, notes in `docs/DEPLOY_VPS.md`
  - [x] Upload from the admin panel (Phase 6, 2026-10-10)
  - [ ] Phone check with a real photo; check the Docker image on the VPS (Alpine `sharp`)
  - [ ] Later, when moving: S3 driver for ArvanCloud in `lib/storage.ts` + `NEXT_PUBLIC_MEDIA_BASE_URL`
- [x] Stock tracking per size/color: orders check and decrement stock safely; product page greys out sold-out sizes/colors, shows "only N left" (3 or fewer) and a disabled "ناموجود" button; cards show a "ناموجود" strip (confirmed on phone, 2026-10-10)

## Phase 4 — Orders and payment
- [x] Save orders in the database: `lib/orders.ts` writes orders + order_items and decrements stock in one transaction; out-of-stock returns a clear message (tested on Postgres 16 incl. parallel orders for the last piece; confirmed on phone, 2026-10-10). Without `DATABASE_URL` it still logs `NEW_ORDER`
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
- [x] Admin login (protected): single password in the `ADMIN_PASSWORD` server setting, signed 7-day cookie, middleware locks `/admin` and `/api/admin`, 5-wrong-tries limit, locked when the password is not set (2026-10-10). Set `ADMIN_PASSWORD` on Railway / in the VPS `.env`, then phone check at `/admin`
- [x] Owner set `ADMIN_PASSWORD` in Railway (2026-10-10)
- [x] Phone-checked `/admin`: login, logout, products list, edit a product, hide/show, edit sizes/colors/stock (confirmed 2026-10-10)
- [?] Later, if more people need access: separate admin accounts (decided 2026-10-10: one shared password for now)
- [ ] Add / edit / hide products, prices, discounts, stock:
  - [x] Products list in `/admin/products` (all products incl. hidden, photo, price, old price, total stock, sold-out, hidden badge); tested with a real Postgres
  - [x] Edit a product in `/admin/products/<id>`: title, description, category, price, old price (discount), hide/show; validated on the server, API re-checks the login (`lib/adminGuard.ts`); tested with a real Postgres
  - [x] Edit sizes, colors and stock per size/color in `/admin/products/<id>` (`lib/adminVariants.ts`, `PUT /api/admin/products/<id>/variants`, `components/admin/VariantsEditor.tsx`): add/remove rows, absolute stock; only rows the admin changed are written, and a row whose stock changed meanwhile (new order) gives a conflict message instead of overwriting; at least one row required; tested with a real Postgres incl. injection-like text and parallel orders (2026-10-10)
  - [x] Photo upload in `/admin/products/<id>` (admin only; `lib/adminPhotos.ts`, `POST/PUT/DELETE /api/admin/products/<id>/photos`, `components/admin/PhotoManager.tsx`): the browser shrinks the photo first, the server checks it is a real picture, fixes rotation, resizes to 1600px, converts to WebP and strips metadata, then stores it through `lib/storage.ts`; set main photo, move earlier/later, delete (2-tap confirm, file removed too); max 10 photos, 8 MB per file; tested with a real Postgres incl. fake/empty/oversize files, bad keys and 14 parallel uploads (2026-10-10). `sharp` is now an explicit dependency
  - [x] Phone-checked photo upload (confirmed 2026-10-10). NOTE: on Railway the disk is wiped at every deploy, so uploaded photos disappear on the next push (staging only). To keep them there, add a Railway volume on `clothes-shop` mounted at `/data` and set `UPLOAD_DIR=/data/uploads`. On the VPS the Docker `uploads` volume keeps them
  - [x] Add a new product (`/admin/products/new`, `POST /api/admin/products`, `createProduct` in `lib/adminProducts.ts`): name, category, price, old price, description, at least one size/color/stock row; made in one transaction, address (slug) = category + random suffix (e.g. `dress-3fa9c1`); starts hidden so it can be shown after photos are added; then opens the edit page to add photos. Tested with a real Postgres incl. validation, injection-like text, hidden -> 404, show -> page and shop list, ordering the new variants (2026-10-10)
  - [x] Phone-checked add a new product (confirmed 2026-10-10)
- [x] Orders in the admin (2026-10-10): `/admin/orders` (newest first, status chips with counts, search by code/mobile/name, 30 per page), `/admin/orders/<id>` (customer, items snapshot, totals), status changes via `PATCH /api/admin/orders/<id>` (`lib/adminOrders.ts`, pure rules in `lib/orderStatus.ts`: one step forward, one step back, or cancel before delivery; canceled is final), cancel puts the pieces back in stock exactly once in the same transaction, stale/duplicate clicks are refused, dashboard card links here and shows new orders; packing slip `/admin/orders/<id>/print` (checkboxes, address, note, items, totals; buttons hidden on paper). Tested with a real Postgres incl. 5 parallel cancels and a deleted variant
  - [ ] Phone check: place a test order in the shop, open it in `/admin/orders`, confirm, ship, print the slip (browser print or save as PDF), cancel another one and see the stock come back
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
