import { releaseExpiredOrdersSoon } from '@/lib/orderExpiry';

// Keeps the "release stock of unpaid online orders" job going in the background (every 2 minutes).
// Orders are also swept right before a new order is created (lib/orders.ts).
if (process.env.DATABASE_URL) {
  const timer = setInterval(() => { void releaseExpiredOrdersSoon(); }, 2 * 60_000);
  timer.unref();
}
