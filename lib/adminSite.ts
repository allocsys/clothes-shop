import { revalidatePath } from 'next/cache';
import { db, hasDb } from './db';
import { SOCIALS, isHttpUrl, type SiteSettings } from './siteSettings';

// Saving the shop texts from the admin panel. Everything is checked here, the browser only helps.

export type SiteSaveError = 'no_database' | 'bad_input' | 'server';
export type SiteParse = { ok: true; settings: SiteSettings } | { ok: false; error: SiteSaveError; field?: string };

// Persian and Arabic digits become normal digits so tel: links work.
function asciiDigits(s: string): string {
  let out = '';
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    if (c >= 1776 && c <= 1785) out += String(c - 1776);
    else if (c >= 1632 && c <= 1641) out += String(c - 1632);
    else out += ch;
  }
  return out;
}

function clean(v: unknown, max: number): string | null {
  if (v === undefined || v === null) return '';
  if (typeof v !== 'string') return null;
  const t = v.replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : null;
}

// '' stays empty; a full http(s) link is kept; a bare user name (with or without @) becomes the platform link.
function resolveSocial(base: string, v: string): string | null {
  if (v === '') return '';
  if (/^https?:\/\//i.test(v)) return isHttpUrl(v) && v.length <= 200 ? new URL(v).toString() : null;
  const id = v.replace(/^@/, '');
  return /^[A-Za-z0-9_.]{3,60}$/.test(id) ? base + id : null;
}

export function parseSiteInput(raw: unknown): SiteParse {
  const r = (raw && typeof raw === 'object' ? raw : null) as any;
  if (!r) return { ok: false, error: 'bad_input' };

  const promo = clean(r.promo, 120);
  if (promo === null) return { ok: false, error: 'bad_input', field: 'promo' };
  const address = clean(r.address, 200);
  if (address === null) return { ok: false, error: 'bad_input', field: 'address' };

  const phoneRaw = clean(r.phone, 30);
  if (phoneRaw === null) return { ok: false, error: 'bad_input', field: 'phone' };
  const phone = asciiDigits(phoneRaw);
  if (phone !== '' && !(/^[0-9+\-() ]{5,30}$/.test(phone) && (phone.match(/[0-9]/g) ?? []).length >= 5)) {
    return { ok: false, error: 'bad_input', field: 'phone' };
  }

  const socials = { instagram: '', telegram: '', eitaa: '' } as SiteSettings['socials'];
  for (const s of SOCIALS) {
    const v = clean(r.socials?.[s.id], 200);
    const href = v === null ? null : resolveSocial(s.base, v);
    if (href === null) return { ok: false, error: 'bad_input', field: s.id };
    socials[s.id] = href;
  }
  return { ok: true, settings: { promo, phone, address, socials } };
}

export async function saveSiteSettings(raw: unknown): Promise<SiteParse> {
  if (!hasDb()) return { ok: false, error: 'no_database' };
  const parsed = parseSiteInput(raw);
  if (!parsed.ok) return parsed;
  try {
    await db().query(
      `INSERT INTO settings (key, value, updated_at) VALUES ('site', $1::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [JSON.stringify(parsed.settings)],
    );
  } catch (e) {
    console.error('SITE_SAVE_FAILED', e);
    return { ok: false, error: 'server' };
  }
  try {
    revalidatePath('/', 'layout');
  } catch (e) {
    console.error('SITE_REVALIDATE_FAILED', e);
  }
  return parsed;
}
