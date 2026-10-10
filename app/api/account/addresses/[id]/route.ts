import { NextResponse } from 'next/server';
import { hasDb } from '@/lib/db';
import { getCurrentCustomer, type Customer } from '@/lib/auth/session';
import { deleteAddress, setDefaultAddress, updateAddress, validateAddress } from '@/lib/addresses';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };
const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status, headers: NO_STORE });

async function who(): Promise<Customer | NextResponse> {
  if (!hasDb()) return fail('حساب کاربری فعلاً در دسترس نیست.', 503);
  let customer: Customer | null;
  try { customer = await getCurrentCustomer(); } catch { return fail('حساب کاربری فعلاً در دسترس نیست.', 503); }
  return customer ?? fail('ابتدا وارد حساب خود شوید.', 401);
}

const parseId = async (params: Promise<{ id: string }>) => {
  const raw = (await params).id;
  const id = /^\d{1,9}$/.test(raw) ? Number(raw) : 0;
  return id > 0 ? id : null;
};

// PATCH { makeDefault: true }                       -> makes this address the default
// PATCH { title?, city, postalCode?, address, isDefault? } -> edits it
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await who();
  if (c instanceof NextResponse) return c;
  const id = await parseId(params);
  if (id === null) return fail('این آدرس پیدا نشد.', 404);
  let body: any;
  try { body = await req.json(); } catch { return fail('درخواست نامعتبر است.', 400); }
  try {
    if (body?.makeDefault === true && body?.city === undefined && body?.address === undefined) {
      const r = await setDefaultAddress(c.id, id);
      return r.ok ? NextResponse.json({ ok: true, addresses: r.addresses }, { headers: NO_STORE }) : fail(r.error, r.status);
    }
    const checked = validateAddress(body);
    if (!checked.ok) return fail(checked.error, 400);
    const r = await updateAddress(c.id, id, checked.value, body?.isDefault === true);
    return r.ok ? NextResponse.json({ ok: true, addresses: r.addresses }, { headers: NO_STORE }) : fail(r.error, r.status);
  } catch (e) {
    console.error('ADDRESS_UPDATE_ERROR', e);
    return fail('ذخیره انجام نشد. دوباره تلاش کنید.', 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await who();
  if (c instanceof NextResponse) return c;
  const id = await parseId(params);
  if (id === null) return fail('این آدرس پیدا نشد.', 404);
  try {
    const r = await deleteAddress(c.id, id);
    return r.ok ? NextResponse.json({ ok: true, addresses: r.addresses }, { headers: NO_STORE }) : fail(r.error, r.status);
  } catch (e) {
    console.error('ADDRESS_DELETE_ERROR', e);
    return fail('حذف انجام نشد. دوباره تلاش کنید.', 500);
  }
}
