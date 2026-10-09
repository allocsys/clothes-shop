// Where product photos are served from.
//
// The database stores only a photo KEY such as "products/abc.jpg" (never a full URL), so the
// storage can change without touching any product data:
//   - Server disk (default): files live in UPLOAD_DIR and are served by app/media/[...path]/route.ts
//     at /media/<key>.
//   - ArvanCloud (or any S3-style storage/CDN): set NEXT_PUBLIC_MEDIA_BASE_URL at BUILD time to the
//     public URL (e.g. https://shop.s3.ir-thr-at1.arvanstorage.ir). Keys are then served from there
//     and next.config.mjs allows that host for next/image.
// Old values that are already full URLs or absolute paths are passed through unchanged.

const BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? '').replace(/\/+$/, '');

export function mediaUrl(key: string): string {
  if (/^https?:\/\//i.test(key) || key.startsWith('/')) return key;
  return (BASE || '/media') + '/' + key.replace(/^\/+/, '');
}
