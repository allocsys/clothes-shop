import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminGuard';
import { saveSiteSettings } from '@/lib/adminSite';

export const dynamic = 'force-dynamic';

// PUT /api/admin/site  { promo, phone, address, socials: { instagram, telegram, eitaa } }
// Answers { ok: true, settings } with the cleaned values (digits, links) so the form can show what was really saved.
export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const res = await saveSiteSettings(body);
  if (res.ok) return NextResponse.json({ ok: true, settings: res.settings });
  if (res.error === 'no_database') return NextResponse.json({ error: res.error }, { status: 503 });
  if (res.error === 'server') return NextResponse.json({ error: res.error }, { status: 500 });
  return NextResponse.json({ error: res.error, field: res.field }, { status: 400 });
}
