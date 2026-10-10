// Dates in the admin: Persian calendar, Tehran time. Safe for server and browser.
const fmt = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tehran' });
export const formatDateTime = (iso: string) => fmt.format(new Date(iso));
