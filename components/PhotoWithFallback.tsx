'use client';

import { useState } from 'react';
import Image from 'next/image';
import GarmentArt from '@/components/GarmentArt';

type Props = {
  src: string;
  category: string;
  seed: string;
  alt: string;
  sizes: string;
  priority?: boolean;
};

// Photo that quietly switches to the garment drawing if the file is missing (404) or broken,
// so customers never see a broken-image icon or alt text.
export default function PhotoWithFallback({ src, category, seed, alt, sizes, priority }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed) return <GarmentArt category={category} seed={seed} />;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className='object-cover'
      onError={() => setFailed(true)}
    />
  );
}
