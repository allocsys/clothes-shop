import { toEnglishDigits } from './checkout';

// Order codes look like MP-AB12CD34. People type them in lower case, with spaces, without the dash,
// or on a Persian keyboard, so clean the text up before checking it.
export function normalizeOrderCode(input: string): string {
  const s = toEnglishDigits(input).toUpperCase().replace(/[\s‌‏‎_-]/g, '');
  return /^MP[A-Z0-9]{8}$/.test(s) ? 'MP-' + s.slice(2) : s;
}

export const isOrderCode = (v: string): boolean => /^MP-[A-Z0-9]{8}$/.test(v);
