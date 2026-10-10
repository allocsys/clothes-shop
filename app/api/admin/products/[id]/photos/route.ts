import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminGuard';
import { addPhoto, convertPhoto, MAX_PHOTOS, MAX_UPLOAD_BYTES, removePhoto, reorderPhotos } from '@/lib/adminPhotos';
import { hasDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function productId(params: Promise<{ id: string }>): Promise<number | null> {
  const id = Number((await params).id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// POST /api/admin/products/:id/photos   multipart form, field "file"  -> adds one photo at the end
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!hasDb()) return NextResponse.json({ error: 'no_database' }, { status: 503 });
  const id = await productId(params);
  if (!id) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json({ error: 'invalid', message: 'حجم عکس بیشتر از ۸ مگابایت است.' }, { status: 413 });
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await req.formData()).get('file');
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  if (!file || typeof file === 'string') return NextResponse.json({ error: 'invalid', message: 'فایلی انتخاب نشده است.' }, { status: 400 });

  const converted = await convertPhoto(Buffer.from(await file.arrayBuffer()));
  if (!converted.ok) return NextResponse.json({ error: 'invalid', message: converted.error }, { status: 400 });

  const res = await addPhoto(id, converted.data);
  if (!res.ok) {
    if (res.reason === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json({ error: 'invalid', message: `حداکثر ${MAX_PHOTOS} عکس برای هر محصول.` }, { status: 400 });
  }
  return NextResponse.json({ ok: true, images: res.images });
}

// PUT /api/admin/products/:id/photos   { images: [key, ...] }  -> new order; the first key is the main photo
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!hasDb()) return NextResponse.json({ error: 'no_database' }, { status: 503 });
  const id = await productId(params);
  if (!id) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const body = (await req.json().catch(() => null)) as { images?: unknown } | null;
  const order = body?.images;
  if (!Array.isArray(order) || order.length > MAX_PHOTOS || !order.every((k) => typeof k === 'string')) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const res = await reorderPhotos(id, order as string[]);
  if (!res.ok) {
    if (res.reason === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json({ error: 'mismatch' }, { status: 409 });
  }
  return NextResponse.json({ ok: true, images: res.images });
}

// DELETE /api/admin/products/:id/photos   { key }  -> removes one photo (and its file)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!hasDb()) return NextResponse.json({ error: 'no_database' }, { status: 503 });
  const id = await productId(params);
  if (!id) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const body = (await req.json().catch(() => null)) as { key?: unknown } | null;
  if (typeof body?.key !== 'string' || !body.key) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const res = await removePhoto(id, body.key);
  if (!res.ok) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true, images: res.images });
}
