import GarmentArt from '@/components/GarmentArt';
import PhotoWithFallback from '@/components/PhotoWithFallback';
import { mediaUrl } from '@/lib/media';

type Props = {
  image?: string; // photo key from the database; empty = show the placeholder drawing
  category: string;
  seed: string;
  alt: string;
  sizes: string; // how wide the image is on screen, so phones download small files
  priority?: boolean;
};

// Product photo through next/image (resized and compressed for the visitor's screen).
// Falls back to the garment drawing when the product has no photo yet.
// The parent must be `relative` and have a fixed size or aspect ratio.
export default function ProductImage({ image, category, seed, alt, sizes, priority }: Props) {
  if (!image) return <GarmentArt category={category} seed={seed} />;
  return (
    <PhotoWithFallback src={mediaUrl(image)} category={category} seed={seed} alt={alt} sizes={sizes} priority={priority} />
  );
}
