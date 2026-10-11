#!/usr/bin/env bash
# Smoke test against a running shop. Usage: bash scripts/smoke.sh [base_url]
# Needs a migrated and seeded database (npm run db:migrate && npm run db:seed).
# Exits with 1 if any check fails.

BASE="${1:-http://localhost:3100}"
pass=0
fail=0

ok()   { pass=$((pass + 1)); echo "ok    $1"; }
bad()  { fail=$((fail + 1)); echo "FAIL  $1"; }

# expect_status <path> <code>
expect_status() {
  got="$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$BASE$1")"
  if [ "$got" = "$2" ]; then ok "$1 -> $got"; else bad "$1 -> $got (wanted $2)"; fi
}

# expect_body <path> <text that must appear> <label>
expect_body() {
  if curl -s --max-time 30 "$BASE$1" | grep -qF -- "$2"; then ok "$1 has $3"; else bad "$1 is missing $3"; fi
}

# Public pages
for p in / /shop /track /account /cart /wishlist; do expect_status "$p" 200; done
expect_status /shop?category=bottoms 200
expect_status /product/sample-manteau-1 200

# Info pages (including the fixed unknown-slug case)
for s in about-us contact-us faq return-policy terms-and-conditions; do
  expect_status "/pages/$s" 200
  expect_body "/pages/$s" '<h1' 'a heading'
done
for s in nope constructor toString __proto__; do expect_status "/pages/$s" 404; done
expect_status /product/does-not-exist 404
expect_status /no-such-page 404

# SEO
expect_body /robots.txt 'Disallow: /admin' 'the admin rule'
expect_body /robots.txt 'Disallow: /cart' 'the cart rule'
expect_body /robots.txt 'Sitemap: https://shop.example.test/sitemap.xml' 'the sitemap link (SITE_URL)'
expect_body /sitemap.xml '<urlset' 'a urlset'
expect_body /sitemap.xml 'https://shop.example.test/product/sample-manteau-1' 'the seed product'
expect_body /sitemap.xml 'https://shop.example.test/pages/faq' 'the faq page'
expect_body /product/sample-manteau-1 'application/ld+json' 'JSON-LD'
expect_body /product/sample-manteau-1 '"@type":"Product"' 'a Product type'
expect_body /product/sample-manteau-1 'rel="canonical"' 'a canonical link'
expect_body /cart 'noindex' 'noindex'
expect_body /wishlist 'noindex' 'noindex'

# Server must not leak the admin area without login
got="$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$BASE/admin")"
case "$got" in
  200) bad "/admin answered 200 without login" ;;
  *) ok "/admin -> $got (not open)" ;;
esac

echo
echo "passed: $pass, failed: $fail"
[ "$fail" -eq 0 ]
