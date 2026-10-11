// Phone-size checks for the shop. Run by CI (see .github/workflows/ci.yml), or by hand:
//   cd e2e && npm install && npx playwright install chromium
//   ADMIN_PASSWORD=... node phone-check.mjs http://localhost:3100
//
// For every page at 390x844 it looks for:
//   FAIL  the page is wider than the screen (sideways scrolling)
//   FAIL  a tap target smaller than 24px (WCAG 2.2 AA, 2.5.8)
//   FAIL  a button, link or field with no accessible name
//   FAIL  a server error (HTTP 5xx) or an uncaught script error
//   warn  a tap target smaller than 40px (the size the shop aims for)
//   warn  a field whose only name is its placeholder
//   warn  a console error
// Exit code 1 when there is at least one FAIL. Every report line starts with "[phone]".

import { chromium } from 'playwright';
import { appendFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://localhost:3100').replace(/\/+$/, '');
const MIN_FAIL = 24;
const MIN_WARN = 40;
const CART = [{ slug: 'sample-manteau-1', size: 'S', color: 'مشکی', qty: 1 }];

const PUBLIC_PAGES = [
  '/',
  '/shop',
  '/shop?category=bottoms',
  '/product/sample-manteau-1',
  '/cart',
  '/wishlist',
  '/track',
  '/account',
  '/pages/about-us',
  '/pages/contact-us',
  '/pages/faq',
  '/pages/return-policy',
  '/pages/terms-and-conditions',
  '/no-such-page',
];

const lines = [];
let fails = 0;
let warns = 0;
const seen = new Set();

const out = (text) => {
  lines.push(text);
  console.log('[phone] ' + text);
};

// Runs inside the browser. Must not use anything from the outside.
function inspectScreen({ minFail, minWarn }) {
  const vw = window.innerWidth;
  const result = { overflowBy: Math.max(0, document.documentElement.scrollWidth - vw), wide: [], issues: [] };
  const describe = (el) => el.outerHTML.replace(/\s+/g, ' ').slice(0, 120);

  const nameOf = (el) => {
    const aria = (el.getAttribute('aria-label') || '').trim();
    if (aria) return aria;
    const by = el.getAttribute('aria-labelledby');
    if (by) {
      const t = by.split(/\s+/).map((id) => (document.getElementById(id) || {}).textContent || '').join(' ').trim();
      if (t) return t;
    }
    if (el.labels && el.labels.length) {
      const t = Array.from(el.labels).map((l) => l.textContent || '').join(' ').trim();
      if (t) return t;
    }
    const title = (el.getAttribute('title') || '').trim();
    if (title) return title;
    const tag = el.tagName;
    if (tag === 'INPUT' && ['button', 'submit', 'reset'].includes(el.type)) return (el.value || '').trim();
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
      const text = (el.innerText || el.textContent || '').trim();
      if (text) return text;
      const img = el.querySelector('img[alt]');
      if (img && (img.getAttribute('alt') || '').trim()) return img.getAttribute('alt');
      const svgTitle = el.querySelector('svg title');
      if (svgTitle && (svgTitle.textContent || '').trim()) return svgTitle.textContent;
    }
    return '';
  };

  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > vw + 1 && result.wide.length < 3) {
      const cs = getComputedStyle(el);
      if (cs.display !== 'none' && cs.visibility !== 'hidden' && cs.position !== 'fixed') result.wide.push(describe(el));
    }
  }

  const targets = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=tab], label:has(input[type=checkbox]), label:has(input[type=radio])';
  for (const el of document.querySelectorAll(targets)) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
    if (el.closest('[hidden], [inert], [aria-hidden="true"]')) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right <= 0 || r.left >= vw) continue; // off screen, e.g. a closed drawer
    if (el.matches('a[href="#main"]')) continue; // skip link, only shown on keyboard focus
    if (cs.position === 'absolute' && (r.width <= 2 || r.height <= 2)) continue; // visually hidden control, its label is the target

    const w = Math.round(r.width);
    const h = Math.round(r.height);
    const isLabelWrap = el.tagName === 'LABEL';

    if (!isLabelWrap) {
      const name = nameOf(el);
      if (!name) {
        const ph = (el.getAttribute('placeholder') || '').trim();
        result.issues.push({ kind: ph ? 'warn' : 'FAIL', why: ph ? 'name only from placeholder' : 'no accessible name', html: describe(el) });
      }
    }

    if (cs.display === 'inline') continue; // links inside running text are exempt from target size
    if (el.disabled) continue; // not clickable right now
    if ((el.type === 'checkbox' || el.type === 'radio') && el.labels && el.labels[0]) {
      const lr = el.labels[0].getBoundingClientRect();
      if (Math.min(lr.width, lr.height) >= minWarn) continue; // the label is the real tap target
    }
    const small = Math.min(w, h);
    if (small < minFail) result.issues.push({ kind: 'FAIL', why: 'target ' + w + 'x' + h, html: describe(el) });
    else if (small < minWarn) result.issues.push({ kind: 'warn', why: 'target ' + w + 'x' + h, html: describe(el) });
  }
  return result;
}

async function check(page, label, problems) {
  const res = await page.evaluate(inspectScreen, { minFail: MIN_FAIL, minWarn: MIN_WARN });
  const found = [...problems];
  if (res.overflowBy > 0) {
    found.push({ kind: 'FAIL', why: 'page is ' + res.overflowBy + 'px wider than the screen', html: res.wide.join('  |  ') || '(no single element found)' });
  }
  found.push(...res.issues);

  // Header, footer and tab bar repeat on every page: report each problem once.
  let repeated = 0;
  const fresh = [];
  for (const f of found) {
    const key = f.kind + '|' + f.why + '|' + f.html.slice(0, 80);
    if (seen.has(key)) {
      repeated++;
      continue;
    }
    seen.add(key);
    fresh.push(f);
  }
  const nf = found.filter((f) => f.kind === 'FAIL').length;
  const nw = found.length - nf;
  fails += fresh.filter((f) => f.kind === 'FAIL').length;
  warns += fresh.filter((f) => f.kind !== 'FAIL').length;

  out('=== ' + label + ': ' + nf + ' fail, ' + nw + ' warn' + (repeated ? ' (' + repeated + ' already listed above)' : ''));
  for (const f of fresh.slice(0, 25)) out('    ' + f.kind + ' ' + f.why + ' :: ' + f.html);
  if (fresh.length > 25) out('    ... and ' + (fresh.length - 25) + ' more');
}

async function visit(ctx, path, label, after) {
  const page = await ctx.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push({ kind: 'FAIL', why: 'script error', html: String(e.message).slice(0, 160) }));
  page.on('response', (r) => {
    if (r.status() >= 500) problems.push({ kind: 'FAIL', why: 'HTTP ' + r.status(), html: r.url() });
  });
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) problems.push({ kind: 'warn', why: 'console error', html: m.text().slice(0, 160) });
  });
  try {
    await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45000 });
  } catch (e) {
    problems.push({ kind: 'FAIL', why: 'could not load', html: String(e.message).slice(0, 160) });
  }
  await page.waitForTimeout(600);
  if (after) {
    try {
      await after(page);
    } catch (e) {
      problems.push({ kind: 'warn', why: 'interaction skipped', html: String(e.message).slice(0, 160) });
    }
  }
  await check(page, label, problems);
  await page.close();
}

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'fa-IR',
  });
  // One item in the cart so the cart page shows its buttons and the checkout form.
  await ctx.addInitScript(([k, v]) => {
    try {
      if (!window.localStorage.getItem(k)) window.localStorage.setItem(k, v);
    } catch (e) {}
  }, ['mahpari-cart-v1', JSON.stringify(CART)]);

  for (const p of PUBLIC_PAGES) await visit(ctx, p, p);

  await visit(ctx, '/', '/ (menu open)', async (page) => {
    await page.click('button[aria-label="منو"]', { timeout: 5000 });
    await page.waitForTimeout(500);
  });

  await visit(ctx, '/shop', '/shop (filters open)', async (page) => {
    await page.locator('summary', { hasText: /فیلتر/ }).first().click({ timeout: 5000 });
    await page.waitForTimeout(500);
  });

  // Admin: sign in through the API (the cookie lands in this browser context).
  const login = await ctx.request.post(BASE + '/api/admin/login', { data: { password: process.env.ADMIN_PASSWORD || '' } });
  if (!login.ok()) {
    fails++;
    out('=== admin: FAIL could not sign in (HTTP ' + login.status() + '), admin pages skipped');
  } else {
    let editPath = '';
    const listPage = await ctx.newPage();
    await listPage.goto(BASE + '/admin/products', { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
    const hrefs = await listPage.$$eval('a[href^="/admin/products/"]', (as) => as.map((a) => a.getAttribute('href')));
    editPath = hrefs.find((h) => /^\/admin\/products\/\d+$/.test(h || '')) || '';
    await listPage.close();

    const adminPages = ['/admin', '/admin/products', '/admin/products/new', '/admin/orders', '/admin/sales', '/admin/analytics'];
    if (editPath) adminPages.push(editPath);
    for (const p of adminPages) await visit(ctx, p, p);
  }

  await browser.close();

  out('');
  out('TOTAL: ' + fails + ' fail, ' + warns + ' warn (each listed once)');
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, '## Phone-size checks (390x844)\n\n```\n' + lines.join('\n') + '\n```\n');
  }
  process.exit(fails > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[phone] crashed: ' + (e && e.stack ? e.stack : e));
  process.exit(2);
});
