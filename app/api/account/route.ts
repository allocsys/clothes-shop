import { NextResponse } from 'next/server';
import { hasDb } from '@/lib/db';
import { getCurrentCustomer } from '@/lib/auth/session';
import { NAME_MAX, NAME_MIN, cleanName, updateCustomerName } from '@/lib/account';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };
const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status, headers: NO_STORE });

// PATCH { name } -> saves the logged-in customer's name.
export async function PATCH(req: Request) {
  if (!hasDb()) return fail('حساب کاربری فعلاً در دسترس نیست.', 503);

  let customer;
  try { customer = await getCurrentCustomer(); } catch { return fail('حساب کاربری فعلاً در دسترس نیست.', 503); }
  if (!customer) return fail('ابتدا وارد حساب خود شوید.', 401);

  let body: any;
  try { body = await req.json(); } catch { return fail('درخواست نامعتبر است.', 400); }
  const name = cleanName(body?.name);
  if (!name) return fail('نام باید بین ' + NAME_MIN + ' تا ' + NAME_MAX + ' حرف باشد.', 400);

  await updateCustomerName(customer.id, name);
  return NextResponse.json({ ok: true, name }, { headers: NO_STORE });
}
