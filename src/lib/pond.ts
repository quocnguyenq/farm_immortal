import { FishStage, ProduceQuality, type Fish, type QualityRate } from "@prisma/client";
import { QUALITY_ORDER } from "./game";
import { prisma } from "./prisma";

export const DEFAULT_AGING_STRENGTH = 0.6;

export type FishOdds = { quality: ProduceQuality; pct: number };

export type PublicFish = {
  id: string;
  fishId: string;
  name: string;
  description: string;
  iconKey: string;
  swimStyle: string;
  sizeScale: number;
  stage: FishStage;
  boughtAt: string;
  /** Thời gian còn lại tới giai đoạn kế (0 khi đã trưởng thành). */
  stageRemainingMs: number;
  stageDurationMs: number;
  /** Linh khí đã hấp thụ sau khi trưởng thành, 0..1. */
  aging: number;
  agingRemainingMs: number;
  agingMaxMs: number;
  odds: FishOdds[];
};

export type PondNext = { level: number; capacity: number; requiredLevel: number; goldCost: number } | null;

export type PondState = {
  level: number;
  capacity: number;
  next: PondNext;
  fish: PublicFish[];
};

export function fishStageAt(fish: Fish, boughtAt: Date, now: number) {
  const age = Math.max(0, now - boughtAt.getTime());
  const fry = fish.durationFryMs;
  const small = fish.durationSmallMs;
  if (age < fry) return { stage: FishStage.FRY, stageRemainingMs: fry - age, stageDurationMs: fry, aging: 0, agingMs: 0 };
  if (age < fry + small)
    return { stage: FishStage.SMALL, stageRemainingMs: fry + small - age, stageDurationMs: small, aging: 0, agingMs: 0 };
  const agingMs = age - fry - small;
  const aging = fish.agingMaxMs > 0 ? Math.min(1, agingMs / fish.agingMaxMs) : 1;
  return { stage: FishStage.ADULT, stageRemainingMs: 0, stageDurationMs: 0, aging, agingMs };
}

/**
 * Tỷ lệ sao của cá: lấy bảng tỷ lệ gốc, nhân trọng số bậc i với e^(strength·aging·i)
 * nên nuôi càng lâu thì sao cao và Thượng cấp càng dễ ra.
 */
export function fishOdds(rates: QualityRate[], aging: number, strength: number): FishOdds[] {
  const weights = QUALITY_ORDER.map((q, i) => {
    const base = rates.find((r) => r.quality === q)?.chanceBps ?? 0;
    return { quality: q, w: base * Math.exp(strength * aging * i) };
  });
  const total = weights.reduce((s, x) => s + x.w, 0) || 1;
  return weights.map(({ quality, w }) => ({ quality, pct: (w / total) * 100 }));
}

export function rollFromOdds(odds: FishOdds[]): ProduceQuality {
  let roll = Math.random() * 100;
  for (const o of odds) {
    if (roll < o.pct) return o.quality;
    roll -= o.pct;
  }
  return odds[odds.length - 1]?.quality ?? ProduceQuality.STAR_0;
}

export async function agingStrength() {
  const cfg = await prisma.gameConfig.findUnique({ where: { key: "fishAgingStrength" } });
  const v = Number(cfg?.value);
  return Number.isFinite(v) && v >= 0 ? v : DEFAULT_AGING_STRENGTH;
}

export async function ensurePond(userId: string) {
  return prisma.playerPond.upsert({ where: { userId }, update: {}, create: { userId, level: 1 } });
}

export async function pondCapacity(level: number) {
  const row = await prisma.pondLevel.findUnique({ where: { level } });
  return row?.capacity ?? 1;
}

export async function getPondState(userId: string): Promise<PondState> {
  const now = Date.now();
  const pond = await ensurePond(userId);
  const [levels, fish, rates, strength] = await Promise.all([
    prisma.pondLevel.findMany({ orderBy: { level: "asc" } }),
    prisma.playerFish.findMany({ where: { userId }, include: { fish: true }, orderBy: { boughtAt: "asc" } }),
    prisma.qualityRate.findMany(),
    agingStrength(),
  ]);
  const current = levels.find((l) => l.level === pond.level);
  const next = levels.find((l) => l.level === pond.level + 1) ?? null;

  return {
    level: pond.level,
    capacity: current?.capacity ?? 1,
    next: next && { level: next.level, capacity: next.capacity, requiredLevel: next.requiredLevel, goldCost: next.goldCost },
    fish: fish.map((pf) => {
      const st = fishStageAt(pf.fish, pf.boughtAt, now);
      return {
        id: pf.id,
        fishId: pf.fishId,
        name: pf.fish.name,
        description: pf.fish.description,
        iconKey: pf.fish.iconKey,
        swimStyle: pf.fish.swimStyle,
        sizeScale: pf.fish.sizeScale,
        stage: st.stage,
        boughtAt: pf.boughtAt.toISOString(),
        stageRemainingMs: st.stageRemainingMs,
        stageDurationMs: st.stageDurationMs,
        aging: st.aging,
        agingRemainingMs: st.stage === FishStage.ADULT ? Math.max(0, pf.fish.agingMaxMs - st.agingMs) : pf.fish.agingMaxMs,
        agingMaxMs: pf.fish.agingMaxMs,
        odds: fishOdds(rates, st.aging, strength),
      };
    }),
  };
}
