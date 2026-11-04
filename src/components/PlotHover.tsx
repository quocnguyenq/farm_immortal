"use client";

import { formatMs, stageLabel } from "@/lib/game";
import type { PublicPlot } from "@/lib/types";
import { CropSprite } from "./CropSprite";

function Bar({
  label,
  value,
  max,
  color,
  paused,
  doneText,
  deplete,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  paused?: boolean;
  doneText?: string;
  deplete?: boolean;
}) {
  const remainPct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  const progressPct = max <= 0 ? 100 : Math.max(0, Math.min(100, ((max - value) / max) * 100));
  const fill = deplete ? remainPct : progressPct;
  return (
    <div className="mt-1.5">
      <div className="mb-0.5 flex justify-between text-[10px] font-bold">
        <span>{label}</span>
        <span>
          {doneText
            ? doneText
            : paused
              ? "Tạm dừng"
              : `${formatMs(value)} · ${Math.round(deplete ? remainPct : progressPct)}%`}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-black/15 ring-1 ring-black/10">
        <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${fill}%`, background: color }} />
      </div>
    </div>
  );
}

export function PlotHover({
  plot,
  remaining,
  waterLeft,
  growing,
}: {
  plot: PublicPlot;
  remaining: number;
  waterLeft: number;
  growing: boolean;
}) {
  const stage = plot.currentStage;
  const stagePct =
    stage === "RIPE"
      ? 100
      : plot.stageDurationMs > 0
        ? Math.round(((plot.stageDurationMs - remaining) / plot.stageDurationMs) * 100)
        : 0;
  const stageOrder = ["SEED", "SPROUT", "GROW", "RIPE"] as const;
  const idx = stage ? stageOrder.indexOf(stage) : -1;
  const inner = plot.stageDurationMs > 0 ? 1 - remaining / plot.stageDurationMs : 1;
  const cyclePct = !stage ? 0 : stage === "RIPE" ? 100 : Math.round(((idx + Math.max(0, inner)) / 3) * 100);

  return (
    <div className="plot-tip">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-14 w-14 overflow-hidden rounded-lg bg-[#efe6c9]">
          {plot.iconKey && stage && <CropSprite iconKey={plot.iconKey} stage={stage} />}
        </div>
        <div>
          <div className="text-sm font-black text-amber-950">{plot.cropName || `Ô đất ${plot.plotIndex + 1}`}</div>
          <div className="text-[11px] font-bold text-lime-800">{stageLabel(stage)}</div>
        </div>
      </div>
      {plot.cropDescription && <p className="mb-2 text-[11px] leading-snug text-amber-900">{plot.cropDescription}</p>}

      {!plot.unlocked && (
        <p className="text-xs font-bold">
          Khóa · Cần cấp {plot.requiredLevel} · {plot.goldCost.toLocaleString("vi-VN")} vàng
        </p>
      )}

      {plot.unlocked && !plot.cropId && <p className="text-xs font-bold">Ô trống — chọn hạt rồi gieo vào đây.</p>}

      {plot.cropId && (
        <>
          <Bar
            label="Tưới nước (còn hiệu lực)"
            value={waterLeft}
            max={plot.waterDurationMs || 1}
            color="linear-gradient(90deg,#4fc3f7,#0288d1)"
            paused={waterLeft <= 0 && stage !== "RIPE"}
            deplete
            doneText={stage === "RIPE" ? "Không cần tưới" : waterLeft <= 0 ? "Hết nước — tưới lại" : undefined}
          />
          <Bar
            label={
              stage === "RIPE"
                ? "Tới giai đoạn sau"
                : `Tới giai đoạn sau (${
                    stage === "SEED" ? "Cây non" : stage === "SPROUT" ? "Phát triển" : "Thu hoạch"
                  })`
            }
            value={stage === "RIPE" ? 0 : remaining}
            max={stage === "RIPE" ? 1 : Math.max(plot.stageDurationMs, 1)}
            color={growing ? "linear-gradient(90deg,#9ccc65,#33691e)" : "linear-gradient(90deg,#bdbdbd,#757575)"}
            paused={!growing && stage !== "RIPE"}
            doneText={stage === "RIPE" ? "Đã chín, thu hoạch" : undefined}
          />
          <div className="mt-1.5">
            <div className="mb-0.5 flex justify-between text-[10px] font-bold">
              <span>Giai đoạn hiện tại</span>
              <span>
                {stageLabel(stage)} · {stagePct}%
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-black/15 ring-1 ring-black/10">
              <div
                className="h-full rounded-full"
                style={{ width: `${stagePct}%`, background: "linear-gradient(90deg,#ffe082,#f9a825)" }}
              />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="mb-0.5 flex justify-between text-[10px] font-bold">
              <span>Chu kỳ cây</span>
              <span>{cyclePct}%</span>
            </div>
            <div className="flex gap-0.5">
              {stageOrder.map((s, i) => (
                <div key={s} className="h-2 flex-1 overflow-hidden rounded-full bg-black/15">
                  <div
                    className="h-full"
                    style={{
                      width: idx > i ? "100%" : idx === i ? `${stage === "RIPE" ? 100 : stagePct}%` : "0%",
                      background: "#43a047",
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-0.5 flex justify-between text-[9px] text-amber-800">
              <span>Hạt</span>
              <span>Non</span>
              <span>Lớn</span>
              <span>Chín</span>
            </div>
          </div>
          <div className="mt-2 rounded-lg bg-amber-100/80 px-2 py-1 text-[11px] font-bold">
            {plot.fertilizedThisStage
              ? `Đã bón: ${plot.fertilizerName || "phân"} (−${plot.fertilizerReducePct}% thời gian giai đoạn này)`
              : stage === "RIPE"
                ? "Không bón thêm — cây đã chín"
                : "Chưa bón phân giai đoạn này (chỉ 1 lần / giai đoạn)"}
          </div>
        </>
      )}
    </div>
  );
}
