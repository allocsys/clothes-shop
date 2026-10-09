// Simple original garment illustrations used as product placeholders.
// Replace with real photos (next/image) once you have them.
// The drawing data lives in lib/garments.ts (shared with the add-to-cart animation).

import { garmentColors, pathsFor } from '@/lib/garments';

export default function GarmentArt({ category, seed }: { category: string; seed: string }) {
  const c = garmentColors(seed);
  return (
    <svg viewBox='0 0 120 160' preserveAspectRatio='xMidYMid slice' className='h-full w-full' aria-hidden='true'>
      <rect width='120' height='160' fill={c.bg} />
      <circle cx='98' cy='26' r='2.5' fill={c.fg} opacity='0.3' />
      <circle cx='20' cy='40' r='1.8' fill={c.fg} opacity='0.25' />
      <circle cx='92' cy='60' r='1.4' fill={c.fg} opacity='0.2' />
      <g transform='translate(0 2)'>
        {pathsFor(category).map((p, i) => (
          <path key={i} d={p.d} transform={p.t} fill={c.fg} />
        ))}
      </g>
    </svg>
  );
}
