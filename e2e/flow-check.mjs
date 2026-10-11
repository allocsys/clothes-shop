// Purchase-flow checks for the shop. Run by CI (job "flow-checks"), or by hand:
//   cd e2e && npm install && npx playwright install chromium
//   ADMIN_PASSWORD=... NEXT_LOG=../next.log node flow-check.mjs http://localhost:3100
//
// Needs the mock SMS and mock payment providers (SMS_PROVIDER=mock, PAYMENT_PROVIDER=mock) and the
// server log in NEXT_LOG (the mock SMS prints the login code there). Every report line starts with "[flow]".
//
// 1. guest checkout, pay through the mock gateway -> order page says paid
// 2. guest checkout, cancel at the gateway -> order page says cancelled
// 3. order page link opens tracking on the same device
// 4. tracking from a fresh browser: wrong mobile is rejected, right mobile shows the order as paid
// 5. login with the SMS code -> order shows in "my orders" -> logout
// 6. admin sees the order in /admin/orders
// Exit code 1 when any step fails.

import { chromium } from 'playwright';
import { readFileSync, appendFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://localhost:3100').replace(/\/+$/, '');
const NEXT_LOG = process.env.NEXT_LOG || '../next.log';
const CART = [{ slug: 'sample-manteau-1', size: 'S', color: 'مشکی', qty: 1 }];

const rndMobile = () => '091' + String(Math.floor(10000000 + Math.random() * 89999999));
const MOBILE = rndMobile();
const MOBILE_CANCEL = rndMobile();
const MOBILE_WRONG = rndMobile();

const lines = [];
let fails = 0;
let lastPage = null;

const out = (text) => {
  lines.push(text);
  console.log('[flow] ' + text);
};

function attach(page) {
  lastPage = page;
  page.on('pageerror', (e) => {
    fails++;
    out('FAIL script error on ' + page.url() + ' :: ' + String(e.message).slice(0, 160));
  });
  page.on('response', (r) => {
    if (r.status() >= 500) {
      fails++;
      out('FAIL HTTP ' + r.status() + ' ' + r.url());
    }
  });
}

async function step(name, fn) {
  try {
    await fn();
    out('PASS ' + name);
  } catch (e) {
    fails++;
    out('FAIL ' + name + ' :: ' + String(e && e.message).split('\n')[0].slice(0, 220));
    if (lastPage) {
      try {
        out('     url: ' + lastPage.url());
        const t = await lastPage.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 300));
        out('     page: ' + t);
      } catch {}
    }
  }
}

async function newCtx(browser, withCart) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'fa-IR',
  });
  if (withCart) {
    await ctx.addInitScript(([k, v]) => {
      try {
        if (!window.localStorage.getItem(k)) window.localStorage.setItem(k, v);
      } catch (e) {}
    }, ['mahpari-cart-v1', JSON.stringify(CART)]);
  }
  return ctx;
}

// Fills the checkout form on /cart, submits, and decides at the mock gateway ('ok' or 'cancel').
async function placeOrder(ctx, mobile, decision) {
  const page = await ctx.newPage();
  attach(page);
  await page.goto(BASE + '/cart', { waitUntil: 'networkidle', timeout: 45000 });
  await page.getByLabel('نام و نام خانوادگی', { exact: true }).fill('تست خودکار');
  await page.getByLabel('شماره موبایل', { exact: true }).fill(mobile);
  await page.getByLabel('استان', { exact: true }).selectOption('تهران');
  // the shipping fee is asked from the server: one manteau is below the free-shipping total, so "shipping with Post" appears
  await page.getByText('ارسال با پست').first().waitFor({ timeout: 15000 });
  await page.getByLabel('شهر', { exact: true }).fill('تهران');
  await page.getByLabel('کد پستی', { exact: true }).fill('1234567890');
  await page.getByLabel('آدرس کامل', { exact: true }).fill('تهران، خیابان آزمایش، پلاک ۱');
  await page.getByRole('button', { name: 'ثبت سفارش' }).click();
  await page.waitForURL(/\/pay\/mock/, { timeout: 30000 });
  await page.getByRole('link', { name: decision === 'ok' ? 'پرداخت موفق' : 'انصراف' }).click();
  await page.waitForURL(/\/order\/MP-[A-Z0-9]{8}/, { timeout: 30000 });
  const code = page.url().match(/MP-[A-Z0-9]{8}/)[0];
  return { page, code };
}

const smsLinesFor = (mobile) => {
  const mask = mobile.slice(0, 4) + '***' + mobile.slice(-4);
  try {
    return readFileSync(NEXT_LOG, 'utf8')
      .split('\n')
      .filter((l) => l.includes('SMS_MOCK') && l.includes(mask));
  } catch {
    return [];
  }
};

async function main() {
  const browser = await chromium.launch();

  // 1. paid order
  let paid = null;
  const ctx1 = await newCtx(browser, true);
  await step('guest checkout + mock payment OK -> order page says paid', async () => {
    paid = await placeOrder(ctx1, MOBILE, 'ok');
    await paid.page.getByText('پرداخت با موفقیت انجام شد').first().waitFor({ timeout: 15000 });
    const body = await paid.page.evaluate(() => document.body.innerText);
    if (!body.includes(paid.code)) throw new Error('order code ' + paid.code + ' not shown on the order page');
    out('     order ' + paid.code);
  });

  // 2. cancelled payment
  const ctx2 = await newCtx(browser, true);
  await step('guest checkout + cancel at gateway -> order page says cancelled', async () => {
    const r = await placeOrder(ctx2, MOBILE_CANCEL, 'cancel');
    await r.page.getByText('پرداخت لغو شد').first().waitFor({ timeout: 15000 });
  });

  // 3. order page -> tracking on the same device (the last order is remembered in localStorage)
  await step('order page link opens tracking with the order already shown', async () => {
    if (!paid) throw new Error('skipped: no paid order');
    await paid.page.getByRole('link', { name: 'پیگیری سفارش' }).first().click();
    await paid.page.waitForURL(/\/track/, { timeout: 15000 });
    await paid.page.getByText('پرداخت انجام شده است.').first().waitFor({ timeout: 15000 });
  });

  // 4. tracking from a fresh browser
  const ctx3 = await newCtx(browser, false);
  await step('tracking: wrong mobile rejected, right mobile shows the paid order', async () => {
    if (!paid) throw new Error('skipped: no paid order');
    const page = await ctx3.newPage();
    attach(page);
    await page.goto(BASE + '/track', { waitUntil: 'networkidle', timeout: 45000 });
    await page.fill('#track-code', paid.code);
    await page.fill('#track-mobile', MOBILE_WRONG);
    await page.getByRole('button', { name: 'پیگیری سفارش', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'پیدا نشد' }).waitFor({ timeout: 15000 });
    await page.fill('#track-mobile', MOBILE);
    await page.getByRole('button', { name: 'پیگیری سفارش', exact: true }).click();
    await page.getByText('پرداخت انجام شده است.').first().waitFor({ timeout: 15000 });
    const body = await page.evaluate(() => document.body.innerText);
    if (!body.includes(paid.code)) throw new Error('order code not shown in tracking');
  });

  // 5. login with the mock SMS code, order history, logout
  const ctx4 = await newCtx(browser, false);
  await step('login with SMS code -> my orders lists the order -> logout', async () => {
    if (!paid) throw new Error('skipped: no paid order');
    const page = await ctx4.newPage();
    attach(page);
    await page.goto(BASE + '/account', { waitUntil: 'networkidle', timeout: 45000 });
    const before = smsLinesFor(MOBILE).length;
    await page.fill('#login-mobile', MOBILE);
    await page.getByRole('button', { name: 'دریافت کد ورود' }).click();

    let code = '';
    for (let i = 0; i < 40 && !code; i++) {
      await page.waitForTimeout(500);
      const now = smsLinesFor(MOBILE);
      if (now.length > before) {
        const m = now[now.length - 1].match(/(?<!\d)\d{6}(?!\d)/);
        if (m) code = m[0];
      }
    }
    if (!code) throw new Error('no new SMS_MOCK line with a 6-digit code in ' + NEXT_LOG);

    await page.fill('#login-code', code);
    await page.getByRole('button', { name: 'ورود', exact: true }).click();
    await page.getByRole('heading', { name: /سفارش.{0,2}های من/ }).waitFor({ timeout: 20000 });
    const body = await page.evaluate(() => document.body.innerText);
    if (!body.includes(paid.code)) throw new Error('order ' + paid.code + ' missing from "my orders"');

    await page.getByRole('button', { name: /خروج/ }).click();
    await page.locator('#login-mobile').waitFor({ timeout: 15000 });
  });

  // 6. admin
  const ctx5 = await newCtx(browser, false);
  await step('admin sees the order in /admin/orders', async () => {
    if (!paid) throw new Error('skipped: no paid order');
    const login = await ctx5.request.post(BASE + '/api/admin/login', { data: { password: process.env.ADMIN_PASSWORD || '' } });
    if (!login.ok()) throw new Error('admin login failed (HTTP ' + login.status() + ')');
    const page = await ctx5.newPage();
    attach(page);
    await page.goto(BASE + '/admin/orders', { waitUntil: 'networkidle', timeout: 45000 });
    const body = await page.evaluate(() => document.body.innerText);
    if (!body.includes(paid.code)) throw new Error('order ' + paid.code + ' not listed');
  });

  await browser.close();

  out('');
  out('TOTAL: ' + fails + ' fail');
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, '## Purchase-flow checks\n\n```\n' + lines.join('\n') + '\n```\n');
  }
  process.exit(fails > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[flow] crashed: ' + (e && e.stack ? e.stack : e));
  process.exit(2);
});
