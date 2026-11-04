import fishArt from "@/lib/fishArt.json";

const ART = fishArt as unknown as Record<string, [number, number]>;

export function fishImageUrl(iconKey: string) {
  return `/farm/fish/${iconKey}.png`;
}

export function fishAspect(iconKey: string) {
  const s = ART[iconKey];
  return s ? s[1] / s[0] : 0.5;
}

export function FishSprite({ iconKey, className = "h-full w-full" }: { iconKey: string; className?: string }) {
  if (!ART[iconKey]) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={fishImageUrl(iconKey)} alt="" draggable={false} className={`object-contain p-1 ${className}`} aria-hidden />
  );
}
