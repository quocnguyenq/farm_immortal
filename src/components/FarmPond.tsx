"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import propArt from "@/lib/propArt.json";
import { fishStageLabel, fishStageScale } from "@/lib/fishText";
import { formatMs } from "@/lib/game";
import type { PondState, PublicFish } from "@/lib/types";
import { fishAspect, fishImageUrl } from "./FishSprite";

const POND = propArt.pond as { size: [number, number]; water: [number, number][] };
export const POND_W = 440;
export const POND_H = Math.round((POND_W * POND.size[1]) / POND.size[0]);
const FISH_LEN = 58;

type Style = {
  speed: number;
  turn: number;
  pause: [number, number];
  burst?: boolean;
  wiggleHz: number;
  wiggleDeg: number;
  bob?: number;
  zig?: number;
  yBias?: number;
  glow?: boolean;
};

/** Mỗi kiểu bơi: tốc độ (px/s), độ gắt khi rẽ (rad/s), nghỉ (s), quẫy đuôi... */
const STYLES: Record<string, Style> = {
  wander: { speed: 22, turn: 1.6, pause: [0.4, 1.6], wiggleHz: 2.2, wiggleDeg: 4 },
  dart: { speed: 95, turn: 5, pause: [0.8, 2.4], burst: true, wiggleHz: 6, wiggleDeg: 7 },
  glide: { speed: 30, turn: 0.9, pause: [0, 0.3], wiggleHz: 1.4, wiggleDeg: 2 },
  cruise: { speed: 38, turn: 1.4, pause: [0, 0.2], wiggleHz: 3, wiggleDeg: 3 },
  lurk: { speed: 150, turn: 6, pause: [2.5, 6], burst: true, wiggleHz: 1, wiggleDeg: 1 },
  zigzag: { speed: 44, turn: 3, pause: [0, 0.4], wiggleHz: 4, wiggleDeg: 4, zig: 9 },
  bottom: { speed: 16, turn: 1.2, pause: [0.6, 2.2], wiggleHz: 2.6, wiggleDeg: 9, yBias: 0.7 },
  hover: { speed: 12, turn: 1, pause: [1, 3], wiggleHz: 1.6, wiggleDeg: 2, bob: 3 },
  graceful: { speed: 24, turn: 0.7, pause: [0, 0.5], wiggleHz: 1.8, wiggleDeg: 5 },
  royal: { speed: 20, turn: 0.8, pause: [0.5, 1.5], wiggleHz: 1.5, wiggleDeg: 3, bob: 2, glow: true },
};

type Pt = [number, number];

function shrinkPoly(poly: Pt[], k: number): Pt[] {
  const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
  const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
  return poly.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
}

function inside(poly: Pt[], x: number, y: number) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

function randomPoint(poly: Pt[], yBias?: number): Pt {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  for (let i = 0; i < 40; i++) {
    const r = Math.random();
    const ry = yBias ? 1 - Math.pow(1 - r, 1 + yBias * 3) : r;
    const p: Pt = [x0 + Math.random() * (x1 - x0), y0 + ry * (y1 - y0)];
    if (inside(poly, p[0], p[1])) return p;
  }
  return [(x0 + x1) / 2, (y0 + y1) / 2];
}

type Swimmer = {
  x: number;
  y: number;
  heading: number;
  tx: number;
  ty: number;
  legStart: number;
  pauseUntil: number;
  phase: number;
  dist: number;
  v: number;
  tilt: number;
};

type FishNodes = { root?: HTMLDivElement; mid?: HTMLDivElement; tail?: HTMLDivElement };

export function FarmPond({
  pond,
  now,
  fetchedAt,
  left,
  top,
  onOpen,
  onFish,
}: {
  pond: PondState;
  now: number;
  fetchedAt: number;
  left: number;
  top: number;
  onOpen: () => void;
  onFish: (fish: PublicFish, anchor: { x: number; y: number }) => void;
}) {
  const water = useMemo(
    () => shrinkPoly(POND.water.map(([x, y]) => [x * POND_W, y * POND_H] as Pt), 0.86),
    [],
  );
  const nodes = useRef(new Map<string, FishNodes>());
  const bind = (id: string, part: keyof FishNodes) => (el: HTMLDivElement | null) => {
    const cur = nodes.current.get(id) ?? {};
    cur[part] = el ?? undefined;
    if (cur.root || cur.mid || cur.tail) nodes.current.set(id, cur);
    else nodes.current.delete(id);
  };
  const swimmers = useRef(new Map<string, Swimmer>());
  const fishRef = useRef(pond.fish);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      const sec = t / 1000;
      for (const f of fishRef.current) {
        const style = STYLES[f.swimStyle] ?? STYLES.wander;
        let s = swimmers.current.get(f.id);
        if (!s) {
          const [x, y] = randomPoint(water, style.yBias);
          const [tx, ty] = randomPoint(water, style.yBias);
          s = {
            x, y, tx, ty,
            heading: Math.random() * Math.PI * 2,
            legStart: sec, pauseUntil: 0, phase: Math.random() * 10, dist: 0, v: 0, tilt: 0,
          };
          swimmers.current.set(f.id, s);
        }
        const dx = s.tx - s.x;
        const dy = s.ty - s.y;
        const d = Math.hypot(dx, dy);
        let target = 0;
        let turning = 0;
        if (sec >= s.pauseUntil) {
          if (d < 6) {
            const [a, b] = style.pause;
            s.pauseUntil = sec + a + Math.random() * (b - a);
            [s.tx, s.ty] = randomPoint(water, style.yBias);
            s.legStart = s.pauseUntil;
          } else {
            const want = Math.atan2(dy, dx);
            let diff = want - s.heading;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            turning = Math.max(-1, Math.min(1, diff));
            s.heading += Math.max(-style.turn * dt, Math.min(style.turn * dt, diff));
            const leg = sec - s.legStart;
            target = style.burst ? style.speed * Math.max(0.12, Math.exp(-leg * 2.2)) : style.speed;
            target *= 0.5 + 0.5 * Math.max(0, Math.cos(diff));
            if (d < 30) target *= 0.35 + (0.65 * d) / 30;
          }
        }
        // Gia tốc/giảm tốc mượt: cá có quán tính, không đổi tốc độ tức thì.
        s.v += (target - s.v) * Math.min(1, dt * (style.burst && target > s.v ? 12 : 2.2));
        const nx = s.x + Math.cos(s.heading) * s.v * dt;
        const ny = s.y + Math.sin(s.heading) * s.v * dt * 0.75;
        if (inside(water, nx, ny)) {
          s.x = nx;
          s.y = ny;
          s.dist += s.v * dt;
        } else {
          s.v *= 0.5;
          [s.tx, s.ty] = randomPoint(water, style.yBias);
        }

        const n = nodes.current.get(f.id);
        if (!n?.root) continue;
        const swim = Math.min(1.5, s.v / style.speed);
        const hz = style.wiggleHz * (0.35 + swim * 1.3);
        s.phase += dt * hz * Math.PI * 2;
        const amp = style.wiggleDeg * (0.45 + swim * 1.1) + Math.abs(turning) * 6;
        const bend = turning * 10;
        const bob = style.bob ? Math.sin(sec * 1.3 + s.phase * 0.1) * style.bob : 0;
        const zig = style.zig ? Math.sin(s.dist * 0.09) * style.zig : 0;
        const px = s.x - Math.sin(s.heading) * zig;
        const py = s.y + Math.cos(s.heading) * zig * 0.75 + bob;
        const faceLeft = Math.cos(s.heading) < 0;
        s.tilt += (Math.sin(s.heading) * 12 - s.tilt) * Math.min(1, dt * 4);
        const yaw = Math.sin(s.phase) * amp * 0.12;
        n.root.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%) scaleX(${faceLeft ? -1 : 1}) rotate(${s.tilt + yaw}deg)`;
        n.root.style.zIndex = String(10 + Math.round(py));
        // Uốn thân theo sóng: thân lệch pha sau đầu, đuôi lệch pha sau thân.
        const midA = Math.sin(s.phase - 0.6) * amp * 0.8 + bend * 0.4;
        const tailS = Math.sin(s.phase - 1.5);
        if (n.mid) n.mid.style.transform = `skewY(${midA}deg)`;
        if (n.tail)
          n.tail.style.transform = `scaleX(${1 - 0.18 * Math.abs(tailS)}) skewY(${tailS * amp * 2.2 + bend}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [water]);

  useEffect(() => {
    fishRef.current = pond.fish;
    const ids = new Set(pond.fish.map((f) => f.id));
    for (const id of swimmers.current.keys()) if (!ids.has(id)) swimmers.current.delete(id);
  }, [pond.fish]);

  const elapsed = Math.max(0, now - fetchedAt);
  const ready = pond.fish.filter((f) => f.stage === "ADULT").length;
  const hovered = pond.fish.find((f) => f.id === hover);
  const waterClip = `polygon(${POND.water.map(([x, y]) => `${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`).join(",")})`;

  return (
    <div className="absolute" style={{ left, top, width: POND_W, height: POND_H }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/farm/props/pond.png"
        alt=""
        draggable={false}
        className="pond-img absolute inset-0 h-full w-full cursor-pointer select-none"
        onClick={onOpen}
      />

      {pond.fish.map((f) => {
        const len = FISH_LEN * f.sizeScale * fishStageScale(f.stage);
        const style = STYLES[f.swimStyle] ?? STYLES.wander;
        const src = fishImageUrl(f.iconKey);
        const seg = "pointer-events-none absolute inset-0 h-full w-full max-w-none select-none";
        return (
          <div
            key={f.id}
            ref={bind(f.id, "root")}
            className="pond-fish absolute top-0 left-0 cursor-pointer"
            style={{ width: len, height: len * fishAspect(f.iconKey) }}
            onMouseEnter={() => setHover(f.id)}
            onMouseLeave={() => setHover(null)}
            onClick={(e) => onFish(f, { x: e.clientX, y: e.clientY })}
          >
            <div
              className={`relative h-full w-full ${f.stage === "FRY" ? "opacity-70" : "opacity-90"}`}
              style={{
                filter: `saturate(0.85) drop-shadow(0 ${len * 0.22}px ${len * 0.06}px rgba(0,35,45,0.32))${
                  style.glow ? " drop-shadow(0 0 6px rgba(255,214,90,0.75))" : ""
                }${f.stage === "ADULT" && f.aging >= 1 ? " drop-shadow(0 0 4px rgba(160,255,230,0.85))" : ""}`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" draggable={false} className={seg} style={{ clipPath: "inset(0 0 0 55%)" }} />
              <div
                ref={bind(f.id, "mid")}
                className="absolute inset-0"
                style={{ transformOrigin: "56% 50%" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" draggable={false} className={seg} style={{ clipPath: "inset(0 43% 0 28%)" }} />
                <div
                  ref={bind(f.id, "tail")}
                  className="absolute inset-0"
                  style={{ transformOrigin: "30% 50%" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" draggable={false} className={seg} style={{ clipPath: "inset(0 69% 0 0)" }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="pond-surface pointer-events-none absolute inset-0 z-[400]" style={{ clipPath: waterClip }} />
      <div className="pond-caustics pointer-events-none absolute inset-0 z-[401]" style={{ clipPath: waterClip }} />

      {hovered && (
        <div className="plot-tip pointer-events-none absolute bottom-[86%] left-1/2 z-[999] -translate-x-1/2">
          <div className="text-sm font-black text-amber-950">{hovered.name}</div>
          <div className="text-[11px] font-bold text-lime-800">{fishStageLabel(hovered.stage)}</div>
          <div className="mt-1 text-[11px]">
            {hovered.stage === "ADULT"
              ? `Linh khí ${Math.round(hovered.aging * 100)}% · 5★+ ${(
                  hovered.odds.filter((o) => o.quality === "STAR_5" || o.quality === "PREMIUM").reduce((s, o) => s + o.pct, 0)
                ).toFixed(1)}%`
              : `Lớn tiếp sau ${formatMs(Math.max(0, hovered.stageRemainingMs - elapsed))}`}
          </div>
        </div>
      )}

      <button
        data-ui
        className="pond-sign absolute z-[998]"
        style={{ left: POND_W * 0.06, top: POND_H * 0.02 }}
        onClick={onOpen}
        title="Xem ao cá"
      >
        <span className="block text-[11px] leading-none">Ao cá · Cấp {pond.level}</span>
        <span className="block text-base leading-tight font-black">
          {pond.fish.length}/{pond.capacity}
        </span>
        {ready > 0 && <span className="pond-ready">{ready} có thể thu</span>}
      </button>
    </div>
  );
}
