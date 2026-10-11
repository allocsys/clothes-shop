import { connection } from 'next/server';
import { cache } from 'react';
import { db, hasDb } from './db';
import { site } from './site';

// Shop texts the owner edits in /admin/site: the bar above the header, the phone, the address and the social links.
// Stored as one row in the settings table (key 'site'). No row = the values in lib/site.ts.

export type SocialId = 'instagram' | 'telegram' | 'eitaa';

export const SOCIALS: { id: SocialId; label: string; base: string }[] = [
  { id: 'instagram', label: 'اینستاگرام', base: 'https://instagram.com/' },
  { id: 'telegram', label: 'تلگرام', base: 'https://t.me/' },
  { id: 'eitaa', label: 'ایتا', base: 'https://eitaa.com/' },
];

export type SiteSettings = {
  promo: string; // empty = the bar is hidden
  phone: string;
  address: string;
  socials: Record<SocialId, string>; // full https link, or empty
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  promo: site.promo,
  phone: site.contact.phone,
  address: site.contact.address,
  socials: { instagram: '', telegram: '', eitaa: '' },
};

export function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function text(v: unknown, fallback: string, max: number): string {
  return typeof v === 'string' ? v.slice(0, max) : fallback;
}

// Reads whatever is stored; a missing or damaged field falls back to the default, an empty string stays empty.
export function normalizeSiteSettings(raw: unknown): SiteSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as any;
  const soc = (r.socials && typeof r.socials === 'object' ? r.socials : {}) as any;
  const socials = { ...DEFAULT_SITE_SETTINGS.socials };
  for (const s of SOCIALS) {
    const v = soc[s.id];
    if (typeof v === 'string' && v.length <= 200 && (v === '' || isHttpUrl(v))) socials[s.id] = v;
  }
  return {
    promo: text(r.promo, DEFAULT_SITE_SETTINGS.promo, 120),
    phone: text(r.phone, DEFAULT_SITE_SETTINGS.phone, 30),
    address: text(r.address, DEFAULT_SITE_SETTINGS.address, 200),
    socials,
  };
}

export function socialLinks(s: SiteSettings): { label: string; href: string }[] {
  return SOCIALS.filter((x) => s.socials[x.id]).map((x) => ({ label: x.label, href: s.socials[x.id] }));
}

// Read on every request (the shop chrome shows it), so pages are rendered per request and an edit shows at once.
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  await connection();
  if (!hasDb()) return DEFAULT_SITE_SETTINGS;
  try {
    const { rows } = await db().query('SELECT value FROM settings WHERE key = $1', ['site']);
    return rows[0] ? normalizeSiteSettings(rows[0].value) : DEFAULT_SITE_SETTINGS;
  } catch (e) {
    console.error('SITE_SETTINGS_FAILED', e);
    return DEFAULT_SITE_SETTINGS;
  }
});
