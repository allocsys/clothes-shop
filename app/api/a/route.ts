import { hasDb } from '@/lib/db';
import { trackClient } from '@/lib/analytics';
import { clientIp, isBlocked, recordFail } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// Event collection for the shop's own analytics. Always answers 204 and never shows an error to the visitor.
const MAX_PER_MINUTE = 120;

export async function POST(req: Request) {
  try {
    if (!hasDb()) return new Response(null, { status: 204 });
    const key = 'analytics:' + clientIp(req);
    if (isBlocked(key, MAX_PER_MINUTE)) return new Response(null, { status: 204 });
    recordFail(key, 60 * 1000); // counts every event, so one address cannot flood the table
    const text = await req.text();
    if (text.length > 2000) return new Response(null, { status: 204 });
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return new Response(null, { status: 204 });
    }
    await trackClient(req, body);
  } catch (e) {
    console.error('ANALYTICS_ROUTE_ERROR', e instanceof Error ? e.message : e);
  }
  return new Response(null, { status: 204 });
}
