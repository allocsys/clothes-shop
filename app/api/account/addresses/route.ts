import { NextResponse } from 'next/server';
import { hasDb } from '@/lib/db';
import { getCurrentCustomer, type Customer } from '@/lib/auth/session';
import { addAddress, listAddresses, validateAddress } from '@/lib/addresses';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };
const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status, headers: NO_STORE });

async function who(): Promise<Customer | NextResponse> {
  if (!hasDb()) return fail('حساب کاربری فعلاً در دسترس نیست.', 503);
  let customer: Customer | null;
  try { customer = await getCurrentCustomer(); } catch { return fail('حساب کاربری فعلاً در دسترس نیست.', 503); }
  return customer ?? fail('ابتدا وارد حساب خود شوید.', 401);
}

// GET -> the logged-in customer's saved addresses (default first).
export async function GET() {
  const c = await who();
  if (c instanceof NextResponse) return c;
  try {
    return NextResponse.json({ ok: true, addresses: await listAddresses(c.id) }, { headers: NO_STORE });
  } catch (e) {
    console.error('ADDRESS_LIST_ERROR', e);
    return fail('آدرس‌ها فعلاً در دسترس نیستند.', 503);
  }
}

// POST { title?, city, postalCode?, address, isDefault? } -> adds an address, answers with the new list.
export async function POST(req: Request) {
  const c = await who();
  if (c instanceof NextResponse) return c;
  let body: any;
  try { body = await req.json(); } catch { return fail('درخواست نامعتبر است.', 400); }
  const checked = validateAddress(body);
  if (!checked.ok) return fail(checked.error, 400);
  try {
    const r = await addAddress(c.id, checked.value, body?.isDefault === true);
    return r.ok ? NextResponse.json({ ok: true, addresses: r.addresses }, { headers: NO_STORE }) : fail(r.error, r.status);
  } catch (e) {
    console.error('ADDRESS_ADD_ERROR', e);
    return fail('ذخیره انجام نشد. دوباره تلاش کنید.', 500);
  }
}
