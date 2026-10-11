// Simple original garment illustrations used as product placeholders.
// Replace with real photos (next/image) once you have them.
// The drawing data lives in lib/garments.ts (shared with the add-to-cart animation).

import { garmentColors, pathsFor } from '@/lib/garments';

export default function GarmentArt({ category, seed }: { category: string; seed: string }) {
  const c = garmentColors(seed);
  const id = 'ga' + seed.replace(/[^a-z0-9]/gi, '');
  return (
    <svg viewBox='0 0 120 160' preserveAspectRatio='xMidYMid slice' className='h-full w-full' aria-hidden='true'>
      <defs>
        <linearGradient id={id + 'g'} x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0' stopColor={c.fg} stopOpacity='0' />
          <stop offset='1' stopColor={c.fg} stopOpacity='0.24' />
        </linearGradient>
        <radialGradient id={id + 'r'} cx='0.5' cy='0.42' r='0.55'>
          <stop offset='0' stopColor='#ffffff' stopOpacity='0.55' />
          <stop offset='1' stopColor='#ffffff' stopOpacity='0' />
        </radialGradient>
      </defs>
      <rect width='120' height='160' fill={c.bg} />
      <rect width='120' height='160' fill={`url(#${id}g)`} />
      <rect width='120' height='160' fill={`url(#${id}r)`} />
      <circle cx='98' cy='26' r='2.5' fill={c.fg} opacity='0.3' />
      <circle cx='20' cy='40' r='1.8' fill={c.fg} opacity='0.25' />
      <circle cx='92' cy='60' r='1.4' fill={c.fg} opacity='0.2' />
      <ellipse cx='60' cy='146' rx='30' ry='4.5' fill={c.fg} opacity='0.2' />
      <g transform='translate(60 80) scale(0.84) translate(-60 -78)'>
        {pathsFor(category).map((p, i) => (
          <path key={i} d={p.d} transform={p.t} fill={c.fg} />
        ))}
      </g>
    </svg>
  );
}
