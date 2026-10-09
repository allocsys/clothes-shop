// Shared garment drawings: used by the placeholder product art (components/GarmentArt.tsx)
// and by the fold-and-fly add-to-cart animation (lib/cartAnimation.ts).

export const GARMENT_VIEW = { w: 120, h: 160 };

const palette = [
  { bg: '#ece5f8', fg: '#6b4fa0' },
  { bg: '#f6e7ec', fg: '#b4566e' },
  { bg: '#e4edf7', fg: '#4a6fa5' },
  { bg: '#f7f0e0', fg: '#b08a3e' },
  { bg: '#e3f1ea', fg: '#4f8a72' },
];

const TSHIRT = 'M40 20L20 34l10 20 10-6v82h40V48l10 6 10-20L80 20q-20 14-40 0z';
const BLOUSE = 'M42 20L14 80l12 6 18-34v78h32V52l18 34 12-6L78 20q-18 12-36 0z';
const DRESS = 'M48 18h24l4 34 20 88H24l20-88z';
const COAT = 'M42 18q18 12 36 0l20 18-6 114H66V60H54v90H28L22 36z';
const TROUSERS = 'M38 20h44l6 120H66L60 62l-6 78H32z';
const SCARF = 'M30 20h60l10 40-30 90H50L20 60z';

export function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function garmentColors(seed: string) {
  return palette[hash(seed) % palette.length];
}

export function pathsFor(category: string): { d: string; t?: string }[] {
  switch (category) {
    case 'manteau':
      return [{ d: COAT }];
    case 'blouse':
      return [{ d: BLOUSE }];
    case 'dress':
    case 'skirt':
      return [{ d: DRESS }];
    case 'bottoms':
    case 'trousers':
      return [{ d: TROUSERS }];
    case 'set':
      return [
        { d: TSHIRT, t: 'translate(24 4) scale(.6)' },
        { d: TROUSERS, t: 'translate(30 80) scale(.5)' },
      ];
    case 'accessories':
      return [{ d: SCARF }];
    default:
      return [{ d: TSHIRT }];
  }
}

// The same picture as GarmentArt, as an SVG markup string (for code that builds DOM by hand).
export function garmentMarkup(category: string, seed: string): string {
  const c = garmentColors(seed);
  const paths = pathsFor(category)
    .map((p) => `<path d="${p.d}"${p.t ? ` transform="${p.t}"` : ''} fill="${c.fg}"/>`)
    .join('');
  return (
    `<rect width="${GARMENT_VIEW.w}" height="${GARMENT_VIEW.h}" fill="${c.bg}"/>` +
    `<circle cx="98" cy="26" r="2.5" fill="${c.fg}" opacity="0.3"/>` +
    `<circle cx="20" cy="40" r="1.8" fill="${c.fg}" opacity="0.25"/>` +
    `<circle cx="92" cy="60" r="1.4" fill="${c.fg}" opacity="0.2"/>` +
    `<g transform="translate(0 2)">${paths}</g>`
  );
}
