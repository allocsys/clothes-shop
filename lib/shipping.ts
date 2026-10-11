import { db, hasDb } from './db';
import { provinceZone, type Zone } from '@/data/provinces';
import { FREE_SHIPPING_FROM } from './checkout';

// Shipping = the carrier's price for the parcel's weight and distance (province zone).
// Everything here is plain logic plus two small database reads; nothing is wired into checkout yet.

export const CARRIER_IDS = ['post', 'pishtaz', 'tipax'] as const;
export type CarrierId = (typeof CARRIER_IDS)[number];
export const CARRIER_LABELS: Record<CarrierId, string> = {
  post: 'پست (سفارشی)',
  pishtaz: 'پست پیشتاز',
  tipax: 'تیپاکس',
};
export const ZONES: Zone[] = ['same', 'near', 'far'];

// One price band: parcels up to upToG grams cost fee Toman. Above the last band, every started extra kilogram adds extraPerKg.
export type Band = { upToG: number; fee: number };
export type ZoneRates = { bands: Band[]; extraPerKg: number };
export type CarrierRates = Partial<Record<Zone, ZoneRates>>;
export type ShippingSettings = {
  carrier: CarrierId; // the carrier the shop uses right now (switch it in the admin panel)
  freeFrom: number; // order total from which shipping is free (0 = never free)
  packagingG: number; // weight of the box/bag added to every parcel
  rates: Partial<Record<CarrierId, CarrierRates>>;
};

const BANDS_G = [1000, 2000, 3000, 5000];
const zoneRates = (fees: number[], extraPerKg: number): ZoneRates => ({
  bands: BANDS_G.map((upToG, i) => ({ upToG, fee: fees[i] })),
  extraPerKg,
});

// Starting prices: Iran Post 1405 maximum rates for registered parcels (Toman), taken from the published list
// (Zoomit, Farvardin 1405). The same-province 3-5 kg price was printed as 27,000, lower than the 2-3 kg price, which
// looks like a typo, so 32,000 is used until the owner checks it. Post Pishtaz and Tipax have no public table: the
// owner enters their prices in the admin panel, and until all three zones are filled in they cannot be switched on.
export const DEFAULT_SETTINGS: ShippingSettings = {
  carrier: 'post',
  freeFrom: FREE_SHIPPING_FROM,
  packagingG: 100,
  rates: {
    post: {
      same: zoneRates([20500, 29000, 32000, 32000], 7500),
      near: zoneRates([28500, 37000, 38500, 45500], 9500),
      far: zoneRates([32000, 41200, 44900, 52500], 10000),
    },
  },
};

// ---- reading and cleaning the stored settings (never trust what is in the database blindly) ----

function whole(v: unknown, min: number, max: number): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : null;
}

function parseZone(v: any): ZoneRates | null {
  if (!v || !Array.isArray(v.bands)) return null;
  const bands: Band[] = [];
  for (const b of v.bands.slice(0, 12)) {
    const upToG = whole(b?.upToG, 1, 100000);
    const fee = whole(b?.fee, 0, 10_000_000);
    if (upToG === null || fee === null) return null;
    bands.push({ upToG, fee });
  }
  const extraPerKg = whole(v.extraPerKg, 0, 10_000_000);
  if (bands.length === 0 || extraPerKg === null) return null;
  bands.sort((a, b) => a.upToG - b.upToG);
  return { bands, extraPerKg };
}

export function normalizeSettings(raw: unknown): ShippingSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as any;
  const rates: ShippingSettings['rates'] = {};
  for (const c of CARRIER_IDS) {
    const out: CarrierRates = {};
    for (const z of ZONES) {
      const zr = parseZone(r.rates?.[c]?.[z]) ?? DEFAULT_SETTINGS.rates[c]?.[z];
      if (zr) out[z] = zr;
    }
    if (Object.keys(out).length > 0) rates[c] = out;
  }
  return {
    carrier: CARRIER_IDS.includes(r.carrier) ? r.carrier : DEFAULT_SETTINGS.carrier,
    freeFrom: whole(r.freeFrom, 0, 1_000_000_000) ?? DEFAULT_SETTINGS.freeFrom,
    packagingG: whole(r.packagingG, 0, 5000) ?? DEFAULT_SETTINGS.packagingG,
    rates,
  };
}

// A carrier can be used only when all three zones have prices.
export function isCarrierComplete(rates: CarrierRates | undefined): boolean {
  return !!rates && ZONES.every((z) => (rates[z]?.bands.length ?? 0) > 0);
}

// The carrier that is really used: the chosen one, or Post if the chosen one is incomplete (an order must never fail over a price table).
export function activeCarrier(s: ShippingSettings): CarrierId {
  return isCarrierComplete(s.rates[s.carrier]) ? s.carrier : 'post';
}

export async function getShippingSettings(): Promise<ShippingSettings> {
  if (!hasDb()) return normalizeSettings(null);
  try {
    const { rows } = await db().query('SELECT value FROM settings WHERE key = $1', ['shipping']);
    return normalizeSettings(rows[0]?.value);
  } catch (e) {
    console.error('SHIPPING_SETTINGS_FAILED', e);
    return normalizeSettings(null);
  }
}

// ---- weight ----

// Typical weight of one piece in grams, used when a product has no weight of its own.
const CATEGORY_WEIGHT_G: Record<string, number> = {
  manteau: 800,
  blouse: 300,
  tshirt: 250,
  crop: 200,
  dress: 600,
  bottoms: 500,
  trousers: 600,
  skirt: 400,
  set: 900,
  accessories: 150,
};
const FALLBACK_WEIGHT_G = 500;

export function defaultWeightG(category: string): number {
  return CATEGORY_WEIGHT_G[category] ?? FALLBACK_WEIGHT_G;
}

// Only the products that have a weight of their own; the rest use the category default.
export async function getProductWeights(slugs: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!hasDb() || slugs.length === 0) return map;
  try {
    const { rows } = await db().query('SELECT slug, weight_g FROM products WHERE slug = ANY($1::text[]) AND weight_g IS NOT NULL', [slugs]);
    for (const r of rows) map.set(r.slug, r.weight_g);
  } catch (e) {
    console.error('PRODUCT_WEIGHTS_FAILED', e);
  }
  return map;
}

export function orderWeightG(
  items: { slug: string; qty: number }[],
  products: { slug: string; category: string }[],
  explicit: Map<string, number>,
  packagingG: number,
): number {
  let g = 0;
  for (const it of items) {
    const p = products.find((x) => x.slug === it.slug);
    if (!p) continue;
    g += (explicit.get(it.slug) ?? defaultWeightG(p.category)) * it.qty;
  }
  return g > 0 ? g + packagingG : 0;
}

// ---- price ----

export function feeFor(rates: ZoneRates, weightG: number): number {
  const bands = [...rates.bands].sort((a, b) => a.upToG - b.upToG);
  for (const b of bands) if (weightG <= b.upToG) return b.fee;
  const last = bands[bands.length - 1];
  const extraKg = Math.ceil((weightG - last.upToG) / 1000);
  return last.fee + extraKg * rates.extraPerKg;
}

export type ShippingQuote = { shipping: number; carrier: CarrierId; zone: Zone; weightG: number; free: boolean };

// The fee for one order: free from the free-shipping total, otherwise the carrier's price for this weight and province.
export function quoteShipping(s: ShippingSettings, province: string, weightG: number, subtotal: number): ShippingQuote {
  const carrier = activeCarrier(s);
  const zone = provinceZone(province);
  const free = subtotal <= 0 || (s.freeFrom > 0 && subtotal >= s.freeFrom);
  const zr = s.rates[carrier]?.[zone];
  const shipping = free || !zr ? 0 : feeFor(zr, weightG);
  return { shipping, carrier, zone, weightG, free };
}

// Prices come from OUR product data (never from the browser): subtotal, parcel weight and the shipping fee for a province.
export async function quoteForCart(
  items: { slug: string; qty: number }[],
  products: { slug: string; category: string; price: number }[],
  province: string,
) {
  const subtotal = items.reduce((sum, it) => sum + (products.find((p) => p.slug === it.slug)?.price ?? 0) * it.qty, 0);
  const settings = await getShippingSettings();
  const explicit = await getProductWeights(items.map((i) => i.slug));
  const weightG = orderWeightG(items, products, explicit, settings.packagingG);
  return { subtotal, ...quoteShipping(settings, province, weightG, subtotal) };
}
