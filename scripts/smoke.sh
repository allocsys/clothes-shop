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
expect_body '/shop?category=bottoms' 'rel="canonical" href="https://shop.example.test/shop?category=bottoms"' 'the category canonical'
expect_body '/shop?category=bottoms&sort=price-asc' 'noindex' 'noindex on a sorted view'
expect_body '/shop?q=test' 'noindex' 'noindex on a search view'
expect_body /wishlist 'noindex' 'noindex'

# Analytics collection: a phone browser event is stored (with its source and device), a bot, a bad event name and an admin path are not
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'
post_event() { curl -s -o /dev/null -w '%{http_code}' --max-time 30 -X POST -H 'Content-Type: application/json' -A "$1" -d "$2" "$BASE/api/a"; }
for body in \
  '{"e":"pageview","path":"/smoke-human?x=1","ref":"https://www.instagram.com/"}' \
  '{"e":"hack","path":"/smoke-bad"}' \
  '{"e":"pageview","path":"/admin/smoke-admin"}'; do
  got="$(post_event "$UA" "$body")"
  if [ "$got" = "204" ]; then ok "POST /api/a -> 204"; else bad "POST /api/a -> $got (wanted 204)"; fi
done
got="$(post_event 'Googlebot/2.1' '{"e":"pageview","path":"/smoke-bot"}')"
if [ "$got" = "204" ]; then ok "POST /api/a (bot) -> 204"; else bad "POST /api/a (bot) -> $got (wanted 204)"; fi
expect_status /api/a 405
if command -v psql >/dev/null 2>&1 && [ -n "$DATABASE_URL" ]; then
  count() { psql "$DATABASE_URL" -tAc "SELECT count(*) FROM analytics_events WHERE $1" 2>/dev/null | tr -d ' '; }
  [ "$(count "path = '/smoke-human' AND source = 'instagram' AND device = 'mobile' AND event = 'pageview'")" = "1" ] && ok "analytics stored the phone pageview with source and device" || bad "analytics did not store the phone pageview correctly"
  [ "$(count "path = '/smoke-bot'")" = "0" ] && ok "analytics ignored the bot" || bad "analytics stored a bot event"
  [ "$(count "path IN ('/smoke-bad', '/admin/smoke-admin')")" = "0" ] && ok "analytics ignored a bad event name and an admin path" || bad "analytics stored a bad event or an admin path"
else
  echo "skip  analytics row checks (psql or DATABASE_URL not available)"
fi

# Analytics funnel: product view, cart, checkout and a search with no results are stored with their details, and the admin page shows them
for body in \
  '{"e":"product_view","path":"/product/sample-manteau-1","slug":"sample-manteau-1"}' \
  '{"e":"add_to_cart","path":"/product/sample-manteau-1","slug":"sample-manteau-1"}' \
  '{"e":"checkout_start","path":"/cart"}' \
  '{"e":"search","path":"/shop","query":"smokezeroquery","results":0}'; do
  got="$(post_event "$UA" "$body")"
  if [ "$got" = "204" ]; then ok "POST /api/a funnel event -> 204"; else bad "POST /api/a funnel event -> $got (wanted 204)"; fi
done
if command -v psql >/dev/null 2>&1 && [ -n "$DATABASE_URL" ]; then
  count() { psql "$DATABASE_URL" -tAc "SELECT count(*) FROM analytics_events WHERE $1" 2>/dev/null | tr -d ' '; }
  [ "$(count "event = 'product_view' AND product_slug = 'sample-manteau-1'")" -ge 1 ] 2>/dev/null && ok "analytics stored the product view with its slug" || bad "analytics did not store the product view"
  [ "$(count "event = 'add_to_cart' AND product_slug = 'sample-manteau-1'")" -ge 1 ] 2>/dev/null && ok "analytics stored the add to cart" || bad "analytics did not store the add to cart"
  [ "$(count "event = 'checkout_start'")" -ge 1 ] 2>/dev/null && ok "analytics stored the checkout start" || bad "analytics did not store the checkout start"
  [ "$(count "event = 'search' AND query = 'smokezeroquery' AND results = 0")" = "1" ] && ok "analytics stored the search with its result count" || bad "analytics did not store the search correctly"
fi
if [ -n "$ADMIN_PASSWORD" ]; then
  hdr="$(curl -s -D - -o /dev/null --max-time 30 -X POST -H 'Content-Type: application/json' -d "{\"password\":\"$ADMIN_PASSWORD\"}" "$BASE/api/admin/login")"
  cookie="$(echo "$hdr" | grep -i '^set-cookie:' | head -1 | sed -E 's/^[Ss]et-[Cc]ookie: *([^;]*).*/\1/' | tr -d '\r')"
  if [ -z "$cookie" ]; then
    bad "admin login for the analytics page gave no cookie"
  else
    page="$(curl -s --max-time 30 -H "Cookie: $cookie" "$BASE/admin/analytics?days=7")"
    echo "$page" | grep -qF 'smokezeroquery' && ok "/admin/analytics shows the zero-result search" || bad "/admin/analytics does not show the zero-result search"
    echo "$page" | grep -qF 'instagram' || echo "$page" | grep -qF 'اینستاگرام' && ok "/admin/analytics shows the instagram source" || bad "/admin/analytics does not show the instagram source"
    echo "$page" | grep -qF '/smoke-human' && ok "/admin/analytics lists the visited page" || bad "/admin/analytics does not list the visited page"
    echo "$page" | grep -qF 'مسیر خرید' && ok "/admin/analytics shows the funnel" || bad "/admin/analytics does not show the funnel"
  fi
else
  echo "skip  admin analytics page check (ADMIN_PASSWORD not set)"
fi

# Shipping quote: the fee follows the province zone and the parcel weight (Post table; 1 manteau = 800 g + 100 g box = 900 g;
# the seed manteau costs 1,850,000 so one piece is below the free-shipping total and two pieces are above it)
quote() { curl -s --max-time 30 -X POST -H 'Content-Type: application/json' -d "$1" "$BASE/api/shipping/quote"; }
check_quote() { # <label> <request body> <text that must appear in the answer>
  if quote "$2" | grep -qF -- "$3"; then ok "quote: $1"; else bad "quote: $1 (missing $3)"; fi
}
ITEM1='[{"slug":"sample-manteau-1","size":"S","color":"مشکی","qty":1}]'
ITEM2='[{"slug":"sample-manteau-1","size":"S","color":"مشکی","qty":2}]'
check_quote 'same province fee' "{\"province\":\"خراسان رضوی\",\"items\":$ITEM1}" '"shipping":20500'
check_quote 'neighbouring province fee' "{\"province\":\"سمنان\",\"items\":$ITEM1}" '"shipping":28500'
check_quote 'far province fee' "{\"province\":\"تهران\",\"items\":$ITEM1}" '"shipping":32000'
check_quote 'weight and carrier' "{\"province\":\"تهران\",\"items\":$ITEM1}" '"weightG":900'
check_quote 'carrier is post by default' "{\"province\":\"تهران\",\"items\":$ITEM1}" '"carrier":"post"'
check_quote 'total = subtotal + fee' "{\"province\":\"تهران\",\"items\":$ITEM1}" '"total":1882000'
check_quote 'free shipping above the limit' "{\"province\":\"تهران\",\"items\":$ITEM2}" '"shipping":0'
check_quote 'free flag above the limit' "{\"province\":\"تهران\",\"items\":$ITEM2}" '"free":true'
for body in \
  "{\"province\":\"nowhere\",\"items\":$ITEM1}" \
  "{\"items\":$ITEM1}" \
  "{\"province\":\"تهران\",\"items\":[]}" \
  "{\"province\":\"تهران\",\"items\":[{\"slug\":\"nope\",\"qty\":1}]}" \
  'not json'; do
  got="$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 -X POST -H 'Content-Type: application/json' -d "$body" "$BASE/api/shipping/quote")"
  if [ "$got" = "400" ]; then ok "quote refuses bad input -> 400"; else bad "quote bad input -> $got (wanted 400)"; fi
done
expect_status /api/shipping/quote 405
# An order without a valid province is refused before anything is saved
for cust in '{"name":"x","phone":"09120000000","city":"x","address":"x"}' '{"name":"x","phone":"09120000000","province":"nowhere","city":"x","address":"x"}'; do
  got="$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 -X POST -H 'Content-Type: application/json' -d "{\"customer\":$cust,\"items\":$ITEM1}" "$BASE/api/orders")"
  if [ "$got" = "400" ]; then ok "order without a valid province -> 400"; else bad "order without a valid province -> $got (wanted 400)"; fi
done

# Admin shipping settings: closed without login; with login, bad input is refused and switching the carrier changes the quote
expect_not_open() { # <label> <status>
  case "$2" in
    401|403|307|302) ok "$1 -> $2 (not open)" ;;
    *) bad "$1 -> $2 (should not be open without login)" ;;
  esac
}
expect_not_open '/admin/shipping' "$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$BASE/admin/shipping")"
expect_not_open 'PUT /api/admin/shipping' "$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 -X PUT -H 'Content-Type: application/json' -d '{}' "$BASE/api/admin/shipping")"
if [ -n "$ADMIN_PASSWORD" ]; then
  shdr="$(curl -s -D - -o /dev/null --max-time 30 -X POST -H 'Content-Type: application/json' -d "{\"password\":\"$ADMIN_PASSWORD\"}" "$BASE/api/admin/login")"
  scookie="$(echo "$shdr" | grep -i '^set-cookie:' | head -1 | sed -E 's/^[Ss]et-[Cc]ookie: *([^;]*).*/\1/' | tr -d '\r')"
  if [ -z "$scookie" ]; then
    bad "admin login for the shipping settings gave no cookie"
  else
    put_status() { curl -s -o /dev/null -w '%{http_code}' --max-time 30 -X PUT -H 'Content-Type: application/json' -H "Cookie: $scookie" -d "$1" "$BASE/api/admin/shipping"; }
    expect_put() { # <label> <body> <status>
      got="$(put_status "$2")"
      if [ "$got" = "$3" ]; then ok "shipping settings: $1 -> $got"; else bad "shipping settings: $1 -> $got (wanted $3)"; fi
    }
    Z='{"fees":[10000,20000,30000,40000],"extraPerKg":5000}'
    expect_put 'a carrier without prices cannot be switched on' '{"carrier":"tipax","packagingG":100,"rates":{}}' 400
    expect_put 'a half-filled zone is refused' '{"carrier":"post","packagingG":100,"rates":{"tipax":{"same":{"fees":[1,2,null,null],"extraPerKg":null}}}}' 400
    expect_put 'fees that go down with weight are refused' '{"carrier":"post","packagingG":100,"rates":{"tipax":{"same":{"fees":[9000,8000,7000,6000],"extraPerKg":1}}}}' 400
    expect_put 'a text instead of a number is refused' '{"carrier":"post","packagingG":"abc","rates":{}}' 400
    expect_put 'a complete Tipax table is saved and switched on' "{\"carrier\":\"tipax\",\"packagingG\":100,\"rates\":{\"tipax\":{\"same\":$Z,\"near\":$Z,\"far\":$Z}}}" 200
    check_quote 'quote uses the switched carrier' "{\"province\":\"تهران\",\"items\":$ITEM1}" '"carrier":"tipax"'
    check_quote 'quote uses the Tipax price' "{\"province\":\"تهران\",\"items\":$ITEM1}" '"shipping":10000'
    expect_put 'switching back to Post' '{"carrier":"post","packagingG":100,"rates":{}}' 200
    check_quote 'quote is back on Post' "{\"province\":\"تهران\",\"items\":$ITEM1}" '"shipping":32000'
    page="$(curl -s --max-time 30 -H "Cookie: $scookie" "$BASE/admin/shipping")"
    echo "$page" | grep -qF 'ذخیره تنظیمات ارسال' && ok '/admin/shipping shows the settings form' || bad '/admin/shipping does not show the settings form'
  fi
else
  echo "skip  admin shipping settings checks (ADMIN_PASSWORD not set)"
fi

# Server must not leak the admin area without login
got="$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$BASE/admin")"
case "$got" in
  200) bad "/admin answered 200 without login" ;;
  *) ok "/admin -> $got (not open)" ;;
esac

echo
echo "passed: $pass, failed: $fail"
[ "$fail" -eq 0 ]
