import { db, hasDb } from './db';
import { FREE_SHIPPING_FROM } from './checkout';
import {
  BANDS_G,
  CARRIER_IDS,
  ZONES,
  isCarrierComplete,
  normalizeSettings,
  type CarrierId,
  type CarrierRates,
  type ShippingSettings,
} from './shipping';
import type { Zone } from '@/data/provinces';

// Saving the shipping settings from the admin panel. The browser sends the carrier, the box weight and, per carrier and
// zone, four fees (up to 1, 2, 3 and 5 kg) plus the price of every extra kg. Everything is checked here.

const MAX = 10_000_000;

export type ShippingSaveError = 'no_database' | 'bad_input' | 'partial_zone' | 'fees_decrease' | 'incomplete_carrier' | 'server';
export type ShippingParse = { ok: true; settings: ShippingSettings } | { ok: false; error: ShippingSaveError; carrier?: CarrierId; zone?: Zone };

// null/undefined = empty box, 'bad' = not a whole number in range
function amount(v: unknown): number | null | 'bad' {
  if (v === null || v === undefined) return null;
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= MAX ? v : 'bad';
}

export function parseShippingInput(raw: unknown): ShippingParse {
  const r = (raw && typeof raw === 'object' ? raw : null) as any;
  if (!r || !CARRIER_IDS.includes(r.carrier)) return { ok: false, error: 'bad_input' };
  const packagingG = typeof r.packagingG === 'number' && Number.isInteger(r.packagingG) && r.packagingG >= 0 && r.packagingG <= 5000 ? r.packagingG : null;
  if (packagingG === null) return { ok: false, error: 'bad_input' };

  const rates: Partial<Record<CarrierId, CarrierRates>> = {};
  for (const c of CARRIER_IDS) {
    const out: CarrierRates = {};
    for (const z of ZONES) {
      const zin = r.rates?.[c]?.[z];
      if (zin === null || zin === undefined) continue;
      if (!Array.isArray(zin.fees) || zin.fees.length !== BANDS_G.length) return { ok: false, error: 'bad_input', carrier: c, zone: z };
      const fees: (number | null | 'bad')[] = zin.fees.map(amount);
      const extra = amount(zin.extraPerKg);
      const all = [...fees, extra];
      if (all.includes('bad')) return { ok: false, error: 'bad_input', carrier: c, zone: z };
      const filled = all.filter((n) => n !== null).length;
      if (filled === 0) continue; // the whole zone left empty
      if (filled < all.length) return { ok: false, error: 'partial_zone', carrier: c, zone: z };
      const nums = fees as number[];
      for (let i = 1; i < nums.length; i++) if (nums[i] < nums[i - 1]) return { ok: false, error: 'fees_decrease', carrier: c, zone: z };
      out[z] = { bands: BANDS_G.map((upToG, i) => ({ upToG, fee: nums[i] })), extraPerKg: extra as number };
    }
    if (Object.keys(out).length > 0) rates[c] = out;
  }

  // freeFrom stays the shop constant: the cart's progress bar and the promo bar use the same number.
  const settings = normalizeSettings({ carrier: r.carrier, freeFrom: FREE_SHIPPING_FROM, packagingG, rates });
  if (!isCarrierComplete(settings.rates[settings.carrier])) return { ok: false, error: 'incomplete_carrier', carrier: settings.carrier };
  return { ok: true, settings };
}

export async function saveShippingSettings(raw: unknown): Promise<ShippingParse> {
  if (!hasDb()) return { ok: false, error: 'no_database' };
  const parsed = parseShippingInput(raw);
  if (!parsed.ok) return parsed;
  try {
    await db().query(
      `INSERT INTO settings (key, value, updated_at) VALUES ('shipping', $1::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [JSON.stringify(parsed.settings)],
    );
  } catch (e) {
    console.error('SHIPPING_SAVE_FAILED', e);
    return { ok: false, error: 'server' };
  }
  return parsed;
}
