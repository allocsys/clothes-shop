// Remembers the last order placed on THIS device (browser storage only: never in a link, never sent anywhere
// except to /api/track when the customer opens tracking). Every call is safe if storage is blocked or full.
const KEY = 'mahpari:last-order';

export type LastOrder = { code: string; mobile: string };

export function saveLastOrder(code: string, mobile: string): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ code, mobile }));
  } catch {
    /* storage blocked: tracking just asks for the number as before */
  }
}

export function readLastOrder(): LastOrder | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (v && typeof v.code === 'string' && typeof v.mobile === 'string' && v.code && v.mobile) {
      return { code: v.code, mobile: v.mobile };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function forgetLastOrder(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
