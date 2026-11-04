import cropArt from "@/lib/cropArt.json";

type Stage = "SEED" | "SPROUT" | "GROW" | "RIPE";

type ArtSize = [number, number];
const ART = cropArt as unknown as Record<string, Record<Stage, ArtSize>>;

export function cropImageUrl(iconKey: string, stage: Stage) {
  return `/farm/crops/${iconKey}-${stage.toLowerCase()}.png`;
}

export function CropSprite({
  iconKey,
  stage,
  className = "h-full w-full",
}: {
  iconKey: string;
  stage: Stage;
  className?: string;
}) {
  if (!ART[iconKey]) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cropImageUrl(iconKey, stage)}
      alt=""
      draggable={false}
      className={`object-contain object-bottom p-1 ${className}`}
      aria-hidden
    />
  );
}

// Cây to chiếm trọn 1 ô; còn lại trồng 4 khóm theo lưới 2x2 của ô.
const SINGLE = new Set(["melon", "pumpkin"]);
const HALF_W = 96;
const HALF_H = 54;

function clumpPoints(single: boolean) {
  if (single) return [{ u: 0.5, v: 0.5 }];
  const a = 0.28;
  const b = 0.72;
  return [
    { u: a, v: a },
    { u: b, v: a },
    { u: a, v: b },
    { u: b, v: b },
  ];
}

/** Cây trồng đặt đè lên 1 ô; toạ độ tính từ tâm ô (div cha kích thước 0). */
export function PlotCrop({ iconKey, stage }: { iconKey: string; stage: Stage }) {
  const size = ART[iconKey]?.[stage];
  if (!size) return null;
  const single = SINGLE.has(iconKey);
  const k = (single ? 0.36 : 0.2) * (stage === "SEED" ? 0.7 : 1);
  const w = size[0] * k;
  const h = size[1] * k;
  const src = cropImageUrl(iconKey, stage);
  return (
    <>
      {clumpPoints(single).map(({ u, v }, i) => {
        const dx = (u - v) * HALF_W;
        const dy = (u + v - 1) * HALF_H;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt=""
            draggable={false}
            className="pointer-events-none absolute max-w-none select-none"
            style={{
              width: w,
              height: h,
              left: dx - w / 2,
              top: dy - h * 0.93,
            }}
          />
        );
      })}
    </>
  );
}
