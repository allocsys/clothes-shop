import { contentTypeOf, getStorage, isValidKey } from '@/lib/storage';

// Serves product photos stored on the server disk at /media/<key>.
// (When photos are served from ArvanCloud instead, URLs point there and this route is not used.)
// Keys are unique per upload, so browsers and the CDN may cache them for a year.
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const key = path.join('/');
  const type = contentTypeOf(key);
  if (!isValidKey(key) || !type) return new Response('Not found', { status: 404 });

  const data = await getStorage().get(key);
  if (!data) return new Response('Not found', { status: 404 });

  return new Response(new Uint8Array(data), {
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
