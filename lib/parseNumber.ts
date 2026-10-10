// Number parsing for admin forms (safe to import in the browser). Accepts Persian/Arabic digits and separators.

const toLatin = (input: string) =>
  input
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));

// "۱٬۸۵۰٬۰۰۰" / "1,850,000" -> 1850000. Empty -> null. Anything else -> 'bad'.
export function parseToman(input: string): number | null | 'bad' {
  const latin = toLatin(input).replace(/[,\s\u066C\u060C]/g, '');
  if (latin === '') return null;
  return /^\d{1,10}$/.test(latin) ? Number(latin) : 'bad';
}

// "۱۲" / "12" -> 12; empty or garbage -> null
export function parseCount(input: string): number | null {
  const latin = toLatin(input).trim();
  return /^\d{1,5}$/.test(latin) ? Number(latin) : null;
}
