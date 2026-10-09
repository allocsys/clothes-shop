// Photos served from ArvanCloud / a CDN (NEXT_PUBLIC_MEDIA_BASE_URL, see lib/media.ts) must be allowed here.
const mediaBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
const mediaPatterns = [];
if (mediaBase) {
  const u = new URL(mediaBase);
  mediaPatterns.push({ protocol: u.protocol.replace(':', ''), hostname: u.hostname, ...(u.port ? { port: u.port } : {}) });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker builds set NEXT_OUTPUT=standalone for a small self-contained server
  // (`node server.js`). Plain `next start` hosting (Railway) is unaffected.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  images: {
    remotePatterns: mediaPatterns,
    formats: ['image/webp'],
  },
};

export default nextConfig;
