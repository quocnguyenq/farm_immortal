"use client";

import { useEffect, useRef, useState } from "react";
import { PlotCrop } from "./CropSprite";
import { FarmDecor } from "./FarmDecor";
import { cellCenter, FarmField, FIELD_H, FIELD_W } from "./FarmField";
import { FarmPond } from "./FarmPond";
import { PlotHover } from "./PlotHover";
import propArt from "@/lib/propArt.json";
import { formatMs } from "@/lib/game";
import type { PondState, PublicFish, PublicPlot } from "@/lib/types";
import type { MenuAnchor } from "./ActionMenu";

const WORLD_W = 2400;
const WORLD_H = 1400;
const FIELD_POS = { left: 350, top: 170 };
const MIN_SCALE = 0.45;
const MAX_SCALE = 2.6;
const CELL_CLIP = "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)";
const HOUSE_W = 380;
const HOUSE_H = Math.round((HOUSE_W * propArt.house.size[1]) / propArt.house.size[0]);
const HOUSE = { left: 1260, top: 20 };
const POND_POS = { left: 1330, top: 610 };
/** Vùng nội dung chính (ruộng + nhà + ao) để camera mở đầu vừa khung. */
const CONTENT = { x0: 420, y0: 10, x1: 1790, y1: 900 };

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

export function FarmScene({
  plots,
  now,
  fetchedAt,
  selected,
  onPlot,
  pond,
  onOpenPond,
  onFish,
  onOpenHouse,
}: {
  plots: PublicPlot[];
  now: number;
  fetchedAt: number;
  /** Ô đang mở menu thao tác (ẩn tooltip hover). */
  selected: number | null;
  onPlot: (plot: PublicPlot, anchor: MenuAnchor) => void;
  pond: PondState;
  onOpenPond: () => void;
  onFish: (fish: PublicFish, anchor: MenuAnchor) => void;
  onOpenHouse: (anchor: MenuAnchor) => void;
}) {
  const [hoverRaw, setHover] = useState<number | null>(null);
  const hover = selected ?? hoverRaw;
  const viewportRef = useRef<HTMLDivElement>(null);
  const camRef = useRef({ x: 0, y: 0, scale: 1 });
  const [cam, setCam] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{
    pointerId: number;
    sx: number;
    sy: number;
    ox: number;
    oy: number;
    moved: boolean;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const place = () => {
      const r = el.getBoundingClientRect();
      const cw = CONTENT.x1 - CONTENT.x0;
      const ch = CONTENT.y1 - CONTENT.y0;
      const scale = clamp(Math.min(r.width / cw, (r.height - 90) / ch), MIN_SCALE, 1);
      const next = {
        x: r.width / 2 - ((CONTENT.x0 + CONTENT.x1) / 2) * scale,
        y: (r.height - 90) / 2 - ((CONTENT.y0 + CONTENT.y1) / 2) * scale + 10,
        scale,
      };
      camRef.current = next;
      setCam(next);
    };
    place();
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      const prev = camRef.current;
      const factor = e.deltaY > 0 ? 0.9 : 1.11;
      const scale = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE);
      const wx = (mx - prev.x) / prev.scale;
      const wy = (my - prev.y) / prev.scale;
      const next = { scale, x: mx - wx * scale, y: my - wy * scale };
      camRef.current = next;
      setCam(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-ui]")) return;
    dragRef.current = {
      pointerId: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      ox: camRef.current.x,
      oy: camRef.current.y,
      moved: false,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    if (!drag.moved && dx * dx + dy * dy > 36) {
      drag.moved = true;
      setDragging(true);
      setHover(null);
      viewportRef.current?.setPointerCapture(e.pointerId);
    }
    if (!drag.moved) return;
    const next = { ...camRef.current, x: drag.ox + dx, y: drag.oy + dy };
    camRef.current = next;
    setCam(next);
  }

  function onPointerUp(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setDragging(false);
  }

  return (
    <div
      ref={viewportRef}
      className={`farm-sky relative h-screen w-screen overflow-hidden ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className="absolute top-0 left-0 will-change-transform"
        style={{
          width: WORLD_W,
          height: WORLD_H,
          transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.scale})`,
          transformOrigin: "0 0",
        }}
      >
        <div className="relative h-full w-full">
          <FarmDecor />
          <div className="wood-sign pointer-events-none absolute top-24 left-10 z-10 rotate-[-8deg] rounded-lg px-3 py-2 text-sm">
            TĂNG GIÁ
            <br />
            SẢN XUẤT
          </div>
          <div className="wood-sign pointer-events-none absolute bottom-28 left-12 z-10 rotate-[-6deg] rounded-lg px-3 py-2">
            ← Vườn Thú
          </div>
          <div className="wood-sign pointer-events-none absolute top-60 left-12 z-10 rotate-[4deg] rounded-lg px-3 py-2 text-sm">
            Bạn bè
          </div>

          <div className="absolute" style={{ left: HOUSE.left, top: HOUSE.top, width: HOUSE_W, height: HOUSE_H }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/farm/props/house.png"
              alt="Nhà"
              draggable={false}
              className="house-img h-full w-full cursor-pointer select-none"
              onClick={(e) => {
                if (dragRef.current?.moved || dragging) return;
                onOpenHouse({ x: e.clientX, y: e.clientY });
              }}
            />
            <button
              data-ui
              className="house-sign absolute text-sm font-black"
              style={{ left: HOUSE_W * 0.08, top: HOUSE_H * 0.62 }}
              onClick={(e) => onOpenHouse({ x: e.clientX, y: e.clientY })}
              title="Nhà: kho và chợ"
            >
              Nhà · Kho
            </button>
          </div>

          <FarmPond
            pond={pond}
            now={now}
            fetchedAt={fetchedAt}
            left={POND_POS.left}
            top={POND_POS.top}
            onOpen={onOpenPond}
            onFish={(fish, anchor) => {
              if (dragRef.current?.moved || dragging) return;
              onFish(fish, anchor);
            }}
          />

          <div className="pointer-events-none absolute" style={{ ...FIELD_POS, width: FIELD_W, height: FIELD_H }}>
            <FarmField
              cells={plots.map((p) => ({
                unlocked: p.unlocked,
                wet: p.waterLeftMs - Math.max(0, now - fetchedAt) > 0,
              }))}
              hover={dragging ? null : hover}
            />
            {plots.map((plot) => {
              const { x, y, row, col } = cellCenter(plot.plotIndex);
              const elapsed = Math.max(0, now - fetchedAt);
              const waterLeft = Math.max(0, plot.waterLeftMs - elapsed);
              const growing = Boolean(plot.currentStage && plot.currentStage !== "RIPE" && waterLeft > 0);
              const remaining = growing ? Math.max(0, plot.remainingMs - elapsed) : plot.remainingMs;
              const isHover = hover === plot.plotIndex && !dragging;
              const showTip = isHover && selected == null;
              return (
                <div
                  key={plot.plotIndex}
                  className="absolute h-0 w-0"
                  style={{ left: x, top: y, zIndex: isHover ? 90 : 10 + row * 10 + col }}
                >
                  {plot.unlocked && plot.cropId && plot.iconKey && plot.currentStage && (
                    <PlotCrop iconKey={plot.iconKey} stage={plot.currentStage} />
                  )}
                  <button
                    className="pointer-events-auto absolute -top-[54px] -left-[96px] h-[108px] w-[192px] border-0 bg-transparent p-0"
                    style={{ clipPath: CELL_CLIP, cursor: dragging ? "inherit" : "pointer" }}
                    title=""
                    onMouseEnter={() => {
                      if (!dragging) setHover(plot.plotIndex);
                    }}
                    onMouseLeave={() => setHover(null)}
                    onClick={(e) => {
                      if (dragRef.current?.moved || dragging) return;
                      onPlot(plot, { x: e.clientX, y: e.clientY });
                    }}
                  />
                  {!plot.unlocked && (
                    <div className="pointer-events-none absolute -top-4 -left-4 drop-shadow">
                      <svg viewBox="0 0 32 32" className="h-8 w-8">
                        <rect x="8" y="14" width="16" height="12" rx="2" fill="#f9a825" stroke="#ef6c00" strokeWidth="1.5" />
                        <path d="M11 14 v-4 a5 5 0 0 1 10 0 v4" fill="none" stroke="#ef6c00" strokeWidth="2" />
                      </svg>
                    </div>
                  )}
                  {plot.unlocked && plot.cropId && (
                    <div
                      className={`plot-badge pointer-events-none absolute top-[22px] left-0 -translate-x-1/2 ${
                        plot.currentStage === "RIPE" ? "ripe" : growing ? "" : "dry"
                      }`}
                    >
                      {plot.currentStage === "RIPE" ? "Thu hoạch!" : growing ? formatMs(remaining) : "Cần tưới"}
                    </div>
                  )}
                  {showTip && (
                    <div
                      className={`pointer-events-none absolute left-0 z-50 -translate-x-1/2 ${
                        row < 2 ? "top-[50px]" : "bottom-[70px]"
                      }`}
                    >
                      <PlotHover plot={plot} remaining={remaining} waterLeft={waterLeft} growing={growing} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
