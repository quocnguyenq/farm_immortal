"use client";

import { useState } from "react";
import { FISH_STAGES, fishStageLabel } from "@/lib/fishText";
import { formatMs, qualityLabel } from "@/lib/game";
import type {
  FarmFertilizer,
  FarmInventory,
  FarmSeed,
  FarmState,
  FishInventoryItem,
  PondState,
  PublicFish,
  ShopCrop,
  ShopFish,
} from "@/lib/types";
import { CropSprite } from "./CropSprite";
import { FishSprite } from "./FishSprite";

function Overlay({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-black/35 p-4">
      <div className="modal-card max-h-[80vh] w-full max-w-2xl overflow-auto p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-amber-950">{title}</h2>
          <button className="wood-sign rounded-full px-3 py-1" onClick={onClose}>
            Đóng
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SeedPicker({
  seeds,
  onPick,
  onClose,
}: {
  seeds: FarmSeed[];
  onPick: (cropId: string) => void;
  onClose: () => void;
}) {
  return (
    <Overlay title="Chọn hạt giống" onClose={onClose}>
      {seeds.length === 0 && <p>Kho hạt trống. Mở Chợ để mua.</p>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {seeds.map((s) => (
          <button
            key={s.cropId}
            className="rounded-xl border-2 border-amber-700 bg-white/70 p-3 text-left hover:bg-lime-100"
            onClick={() => onPick(s.cropId)}
          >
            <div className="mb-1 h-16 w-16 overflow-hidden rounded-lg bg-[#efe6c9]">
              <CropSprite iconKey={s.iconKey} stage="RIPE" />
            </div>
            <div className="font-extrabold" style={{ color: s.color }}>
              {s.name}
            </div>
            <div className="text-sm">Còn {s.quantity} hạt</div>
          </button>
        ))}
      </div>
    </Overlay>
  );
}

export function FertPicker({
  fertilizers,
  onPick,
  onClose,
}: {
  fertilizers: FarmFertilizer[];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Overlay title="Chọn phân bón (1 lần / giai đoạn)" onClose={onClose}>
      <div className="grid gap-2">
        {fertilizers.map((f) => (
          <button
            key={f.id}
            className="rounded-xl border-2 border-amber-700 bg-white/70 p-3 text-left hover:bg-lime-100"
            onClick={() => onPick(f.id)}
          >
            <div className="font-extrabold">
              {f.name} · -{f.timeReducePercent}% thời gian
            </div>
            <div className="text-sm">
              {f.price} vàng · {f.description}
            </div>
          </button>
        ))}
      </div>
    </Overlay>
  );
}

export function WarehouseModal({
  inventory,
  fishInventory,
  onSell,
  onSellFish,
  onClose,
}: {
  inventory: FarmInventory[];
  fishInventory: FishInventoryItem[];
  onSell: (item: FarmInventory, qty: number) => void;
  onSellFish: (item: FishInventoryItem, qty: number) => void;
  onClose: () => void;
}) {
  return (
    <Overlay title="Kho sản lượng" onClose={onClose}>
      <h3 className="mb-2 font-black text-lime-900">Nông sản</h3>
      {inventory.length === 0 && <p className="mb-3 text-sm">Chưa có nông sản. Hãy thu hoạch cây chín.</p>}
      <div className="mb-4 grid gap-2">
        {inventory.map((i) => (
          <div key={i.id} className="flex items-center justify-between rounded-xl border-2 border-amber-700 bg-white/70 p-3">
            <div>
              <div className="font-extrabold">
                {i.cropName} · {qualityLabel(i.quality)}
              </div>
              <div className="text-sm">
                {i.quantity} cái · bán {i.sellPrice} vàng/cái
              </div>
            </div>
            <div className="flex gap-2">
              <button className="wood-sign rounded-lg px-2 py-1 text-sm" onClick={() => onSell(i, 1)}>
                Bán 1
              </button>
              <button className="wood-sign rounded-lg px-2 py-1 text-sm" onClick={() => onSell(i, i.quantity)}>
                Bán hết
              </button>
            </div>
          </div>
        ))}
      </div>
      <h3 className="mb-2 font-black text-sky-900">Cá</h3>
      {fishInventory.length === 0 && <p className="text-sm">Chưa có cá. Nuôi cá tới trưởng thành rồi thu ở ao.</p>}
      <div className="grid gap-2">
        {fishInventory.map((i) => (
          <div key={i.id} className="flex items-center justify-between gap-2 rounded-xl border-2 border-sky-700 bg-white/70 p-2">
            <div className="h-12 w-20 shrink-0 rounded-lg bg-sky-100">
              <FishSprite iconKey={i.iconKey} />
            </div>
            <div className="flex-1">
              <div className="font-extrabold">
                {i.name} · {qualityLabel(i.quality)}
              </div>
              <div className="text-sm">
                {i.quantity} con · bán {i.sellPrice} vàng/con
              </div>
            </div>
            <div className="flex gap-2">
              <button className="wood-sign rounded-lg px-2 py-1 text-sm" onClick={() => onSellFish(i, 1)}>
                Bán 1
              </button>
              <button className="wood-sign rounded-lg px-2 py-1 text-sm" onClick={() => onSellFish(i, i.quantity)}>
                Bán hết
              </button>
            </div>
          </div>
        ))}
      </div>
    </Overlay>
  );
}

function TimeBar({ pct, color, label, right }: { pct: number; color: string; label: string; right: string }) {
  return (
    <div className="mt-1">
      <div className="flex justify-between text-[11px] font-bold">
        <span>{label}</span>
        <span>{right}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/15">
        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
      </div>
    </div>
  );
}

function FishCard({
  fish,
  elapsed,
  onHarvest,
}: {
  fish: PublicFish;
  elapsed: number;
  onHarvest: (id: string) => void;
}) {
  const adult = fish.stage === "ADULT";
  const remaining = Math.max(0, fish.stageRemainingMs - elapsed);
  const stagePct = adult ? 100 : fish.stageDurationMs > 0 ? (1 - remaining / fish.stageDurationMs) * 100 : 100;
  const agingRemaining = Math.max(0, fish.agingRemainingMs - (adult ? elapsed : 0));
  const aging = adult && fish.agingMaxMs > 0 ? Math.min(1, 1 - agingRemaining / fish.agingMaxMs) : 0;
  const high = fish.odds.filter((o) => o.quality === "STAR_4" || o.quality === "STAR_5").reduce((s, o) => s + o.pct, 0);
  const premium = fish.odds.find((o) => o.quality === "PREMIUM")?.pct ?? 0;
  const idx = FISH_STAGES.indexOf(fish.stage);

  return (
    <div className="rounded-xl border-2 border-sky-700 bg-white/75 p-2">
      <div className="flex items-center gap-2">
        <div className="h-12 w-20 shrink-0 rounded-lg bg-sky-100">
          <FishSprite iconKey={fish.iconKey} />
        </div>
        <div className="flex-1">
          <div className="font-black">{fish.name}</div>
          <div className="text-xs font-bold text-sky-800">{fishStageLabel(fish.stage)}</div>
          <div className="mt-1 flex gap-1">
            {FISH_STAGES.map((s, i) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= idx ? "bg-sky-600" : "bg-black/15"}`} />
            ))}
          </div>
        </div>
        <button
          disabled={!adult}
          className="wood-sign rounded-lg px-3 py-1 text-sm disabled:opacity-40"
          onClick={() => onHarvest(fish.id)}
        >
          Thu
        </button>
      </div>
      {!adult ? (
        <TimeBar
          pct={stagePct}
          color="linear-gradient(90deg,#4fc3f7,#0288d1)"
          label={`Tới ${fishStageLabel(FISH_STAGES[idx + 1])}`}
          right={formatMs(remaining)}
        />
      ) : (
        <>
          <TimeBar
            pct={aging * 100}
            color="linear-gradient(90deg,#a5f3e0,#26a69a,#ffd54f)"
            label="Linh khí hấp thụ"
            right={aging >= 1 ? "Viên mãn" : `${Math.round(aging * 100)}% · còn ${formatMs(agingRemaining)}`}
          />
          <div className="mt-1 text-[11px]">
            Tỷ lệ hiện tại: 4–5★ <b>{high.toFixed(1)}%</b> · Thượng cấp <b>{premium.toFixed(2)}%</b>
          </div>
        </>
      )}
    </div>
  );
}

export function PondModal({
  pond,
  level,
  gold,
  elapsed,
  onHarvest,
  onHarvestAll,
  onUpgrade,
  onBuyFish,
  onClose,
}: {
  pond: PondState;
  level: number;
  gold: number;
  elapsed: number;
  onHarvest: (id: string) => void;
  onHarvestAll: () => void;
  onUpgrade: () => void;
  onBuyFish: () => void;
  onClose: () => void;
}) {
  const ready = pond.fish.filter((f) => f.stage === "ADULT").length;
  const next = pond.next;
  const canUpgrade = next && level >= next.requiredLevel && gold >= next.goldCost;
  return (
    <Overlay title={`Ao cá · Cấp ${pond.level}`} onClose={onClose}>
      <div className="mb-3 grid gap-2 rounded-xl border-2 border-amber-700 bg-white/70 p-3 sm:grid-cols-[1fr_auto]">
        <div>
          <div className="text-lg font-black">
            Đang nuôi {pond.fish.length}/{pond.capacity} con
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-black/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-700"
              style={{ width: `${(pond.fish.length / Math.max(1, pond.capacity)) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-xs">
            {next
              ? `Cấp ${next.level}: chứa ${next.capacity} con · cần nhân vật cấp ${next.requiredLevel} · ${next.goldCost} vàng`
              : "Ao đã đạt cấp tối đa"}
          </p>
          <p className="mt-1 text-xs text-sky-900">
            Cá trưởng thành là thu được. Để lâu hơn, cá hấp thụ linh khí, tỷ lệ ra sao cao và Thượng cấp tăng dần.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {next && (
            <button className="wood-sign rounded-lg px-3 py-1 text-sm disabled:opacity-40" disabled={!canUpgrade} onClick={onUpgrade}>
              {level < next.requiredLevel ? `Cần cấp ${next.requiredLevel}` : `Nâng cấp · ${next.goldCost}g`}
            </button>
          )}
          <button className="wood-sign rounded-lg px-3 py-1 text-sm" onClick={onBuyFish}>
            Mua cá giống
          </button>
          <button className="wood-sign rounded-lg px-3 py-1 text-sm disabled:opacity-40" disabled={ready === 0} onClick={onHarvestAll}>
            Thu tất cả ({ready})
          </button>
        </div>
      </div>
      {pond.fish.length === 0 && <p>Ao đang trống. Mua cá giống ở Chợ để thả nuôi.</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        {pond.fish.map((f) => (
          <FishCard key={f.id} fish={f} elapsed={elapsed} onHarvest={onHarvest} />
        ))}
      </div>
    </Overlay>
  );
}

export type ShopTab = "seed" | "fish";

export function ShopModal({
  crops,
  fish,
  pond,
  level,
  gold,
  initialTab = "seed",
  onBuy,
  onBuyFish,
  onClose,
}: {
  crops: ShopCrop[];
  fish: ShopFish[];
  pond: PondState;
  level: number;
  gold: number;
  initialTab?: ShopTab;
  onBuy: (cropId: string) => void;
  onBuyFish: (fishId: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<ShopTab>(initialTab);
  const free = Math.max(0, pond.capacity - pond.fish.length);
  return (
    <Overlay title={`Chợ · vàng ${gold}`} onClose={onClose}>
      <div className="mb-3 flex gap-2">
        {(
          [
            ["seed", "Hạt giống"],
            ["fish", "Cá giống"],
          ] as [ShopTab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            className={`rounded-lg px-3 py-1 font-bold ${tab === id ? "wood-sign" : "bg-white/70"}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "fish" && (
        <>
          <p className="mb-2 text-sm">
            Ao còn <b>{free}</b>/{pond.capacity} chỗ. Cá mua về được thả thẳng xuống ao dưới dạng cá giống.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {fish.map((f) => {
              const locked = level < f.unlockLevel;
              return (
                <div key={f.id} className="rounded-xl border-2 border-sky-700 bg-white/70 p-3">
                  <div className="mb-1 h-16 rounded-lg bg-sky-100">
                    <FishSprite iconKey={f.iconKey} />
                  </div>
                  <div className="font-extrabold text-sky-900">{f.name}</div>
                  <p className="min-h-8 text-xs">{f.description}</p>
                  <p className="text-xs">
                    Giống {formatMs(f.durationFryMs)} · Nhỏ {formatMs(f.durationSmallMs)} · Linh khí tối đa{" "}
                    {formatMs(f.agingMaxMs)}
                  </p>
                  <button
                    disabled={locked || free === 0}
                    className="wood-sign mt-2 rounded-lg px-3 py-1 text-sm disabled:opacity-50"
                    onClick={() => onBuyFish(f.id)}
                  >
                    {locked ? `Cấp ${f.unlockLevel}` : free === 0 ? "Ao đầy" : `Mua 1 · ${f.price}g`}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
      {tab === "seed" && <div className="grid gap-2 sm:grid-cols-2">
        {crops.map((c) => {
          const locked = level < c.unlockLevel;
          return (
            <div key={c.id} className="rounded-xl border-2 border-amber-700 bg-white/70 p-3">
              <div className="mb-1 flex items-end gap-1">
                {(["SEED", "SPROUT", "GROW", "RIPE"] as const).map((st) => (
                  <div key={st} className="h-16 w-16 overflow-hidden rounded-lg bg-[#efe6c9]">
                    <CropSprite iconKey={c.iconKey} stage={st} />
                  </div>
                ))}
              </div>
              <div className="font-extrabold" style={{ color: c.color }}>
                {c.name}
              </div>
              <p className="min-h-10 text-xs">{c.description}</p>
              <p className="text-xs">
                Hạt {formatMs(c.durationSeedMs)} · Non {formatMs(c.durationSproutMs)} · Lớn {formatMs(c.durationGrowMs)}
              </p>
              <button
                disabled={locked}
                className="wood-sign mt-2 rounded-lg px-3 py-1 text-sm disabled:opacity-50"
                onClick={() => onBuy(c.id)}
              >
                {locked ? `Cấp ${c.unlockLevel}` : `Mua 1 · ${c.seedPrice}g`}
              </button>
            </div>
          );
        })}
      </div>}
    </Overlay>
  );
}

export function Toast({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="absolute top-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-amber-950 px-4 py-2 text-sm font-bold text-amber-50 shadow-lg">
      {text}
    </div>
  );
}

export type { FarmState };
