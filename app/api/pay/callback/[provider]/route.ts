import { NextResponse } from 'next/server';
import { completePayment } from '@/lib/payments/service';
import { siteOrigin } from '@/lib/payments/origin';

export const dynamic = 'force-dynamic';

// The gateway sends the customer back here (GET with a query string, or POST with a form, depending on the gateway).
async function handle(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const data: Record<string, string> = {};
  new URL(req.url).searchParams.forEach((v, k) => { data[k] = v.slice(0, 500); });
  if (req.method === 'POST') {
    try {
      const form = await req.formData();
      form.forEach((v, k) => { if (typeof v === 'string') data[k] = v.slice(0, 500); });
    } catch { /* no form body */ }
  }

  const origin = siteOrigin(req);
  let to = '/';
  try {
    const r = await completePayment(provider, data);
    if (r.kind === 'paid') to = `/order/${r.code}?pay=ok`;
    else if (r.kind === 'paid_but_canceled' || r.kind === 'duplicate') to = `/order/${r.code}?pay=review`;
    else if (r.kind === 'failed' && r.code) to = `/order/${r.code}?pay=${r.cancelled ? 'cancelled' : 'failed'}`;
  } catch (e) {
    console.error('PAYMENT_CALLBACK_ERROR', provider, e);
  }
  // 303 so the browser follows with GET even after a POST from the gateway.
  return NextResponse.redirect(new URL(to, origin), 303);
}

export const GET = handle;
export const POST = handle;
