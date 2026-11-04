import {
  CropStage,
  ProduceQuality,
  type Crop,
  type PlayerPlot,
  type QualityRate,
} from "@prisma/client";
import { prisma } from "./prisma";

export const WATER_DURATION_MS = 6 * 60 * 60 * 1000;
export const TOTAL_PLOTS = 24;
export const START_PLOTS = 4;

export const STAGE_ORDER: CropStage[] = [
  CropStage.SEED,
  CropStage.SPROUT,
  CropStage.GROW,
  CropStage.RIPE,
];

export const QUALITY_ORDER: ProduceQuality[] = [
  ProduceQuality.STAR_0,
  ProduceQuality.STAR_1,
  ProduceQuality.STAR_2,
  ProduceQuality.STAR_3,
  ProduceQuality.STAR_4,
  ProduceQuality.STAR_5,
  ProduceQuality.PREMIUM,
];

export function xpToNextLevel(level: number) {
  return 80 + (level - 1) * 35;
}

export function durationForStage(crop: Crop, stage: CropStage) {
  if (stage === CropStage.SEED) return crop.durationSeedMs;
  if (stage === CropStage.SPROUT) return crop.durationSproutMs;
  if (stage === CropStage.GROW) return crop.durationGrowMs;
  return 0;
}

export type SellTable = Pick<
  Crop,
  "sellStar0" | "sellStar1" | "sellStar2" | "sellStar3" | "sellStar4" | "sellStar5" | "sellPremium"
>;

export function sellPriceFor(crop: SellTable, quality: ProduceQuality) {
  switch (quality) {
    case ProduceQuality.STAR_0:
      return crop.sellStar0;
    case ProduceQuality.STAR_1:
      return crop.sellStar1;
    case ProduceQuality.STAR_2:
      return crop.sellStar2;
    case ProduceQuality.STAR_3:
      return crop.sellStar3;
    case ProduceQuality.STAR_4:
      return crop.sellStar4;
    case ProduceQuality.STAR_5:
      return crop.sellStar5;
    case ProduceQuality.PREMIUM:
      return crop.sellPremium;
  }
}

export function rollQuality(rates: QualityRate[]): ProduceQuality {
  const total = rates.reduce((s, r) => s + r.chanceBps, 0) || 10000;
  let roll = Math.floor(Math.random() * total);
  const sorted = [...rates].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const rate of sorted) {
    if (roll < rate.chanceBps) return rate.quality;
    roll -= rate.chanceBps;
  }
  return ProduceQuality.STAR_1;
}

export type PublicPlot = {
  plotIndex: number;
  unlocked: boolean;
  requiredLevel: number;
  goldCost: number;
  cropId: string | null;
  cropSlug: string | null;
  cropName: string | null;
  cropDescription: string | null;
  cropColor: string | null;
  cropAccent: string | null;
  iconKey: string | null;
  currentStage: CropStage | null;
  plantedAt: string | null;
  wateredUntil: string | null;
  fertilizedThisStage: boolean;
  fertilizerReducePct: number;
  fertilizerName: string | null;
  isGrowing: boolean;
  remainingMs: number;
  waterLeftMs: number;
  stageDurationMs: number;
  waterDurationMs: number;
};

export function stageLabel(stage: CropStage | null) {
  switch (stage) {
    case CropStage.SEED:
      return "Hạt giống";
    case CropStage.SPROUT:
      return "Cây non";
    case CropStage.GROW:
      return "Phát triển";
    case CropStage.RIPE:
      return "Thu hoạch";
    default:
      return "Ô trống";
  }
}

function applyGrowth(
  plot: PlayerPlot,
  crop: Crop | null,
  now: number,
): Partial<PlayerPlot> & { remainingMs: number; isGrowing: boolean; waterLeftMs: number; stageDurationMs: number } {
  if (!crop || !plot.currentStage || plot.currentStage === CropStage.RIPE) {
    const waterLeftMs = plot.wateredUntil
      ? Math.max(0, plot.wateredUntil.getTime() - now)
      : 0;
    return {
      remainingMs: 0,
      isGrowing: false,
      waterLeftMs,
      stageDurationMs: 0,
      accumulatedMs: plot.accumulatedMs,
      currentStage: plot.currentStage,
      lastProcessedAt: new Date(now),
      fertilizedThisStage: plot.fertilizedThisStage,
      fertilizerReducePct: plot.fertilizerReducePct,
      fertilizerId: plot.fertilizerId,
    };
  }

  let acc = plot.accumulatedMs;
  const last = plot.lastProcessedAt?.getTime() ?? now;
  const waterUntil = plot.wateredUntil?.getTime() ?? 0;
  const growEnd = Math.min(now, waterUntil);
  if (growEnd > last) acc += growEnd - last;

  let stage: CropStage = plot.currentStage;
  let fertilized = plot.fertilizedThisStage;
  let reducePct = plot.fertilizerReducePct;
  let fertId = plot.fertilizerId;

  while (stage !== CropStage.RIPE) {
    const base = durationForStage(crop, stage);
    const dur = Math.max(1000, Math.floor(base * (1 - (fertilized ? reducePct : 0) / 100)));
    if (acc >= dur) {
      acc -= dur;
      const idx = STAGE_ORDER.indexOf(stage);
      stage = STAGE_ORDER[idx + 1];
      fertilized = false;
      reducePct = 0;
      fertId = null;
    } else {
      break;
    }
  }

  const waterLeftMs = Math.max(0, waterUntil - now);
  const isGrowing = stage !== CropStage.RIPE && waterLeftMs > 0;
  const base = stage === CropStage.RIPE ? 0 : durationForStage(crop, stage);
  const stageDurationMs = Math.max(
    0,
    Math.floor(base * (1 - (fertilized ? reducePct : 0) / 100)),
  );
  const remainingMs = stage === CropStage.RIPE ? 0 : Math.max(0, stageDurationMs - acc);

  return {
    accumulatedMs: Math.floor(acc),
    currentStage: stage,
    lastProcessedAt: new Date(now),
    fertilizedThisStage: fertilized,
    fertilizerReducePct: reducePct,
    fertilizerId: fertId,
    remainingMs,
    isGrowing,
    waterLeftMs,
    stageDurationMs,
  };
}

export async function processUserPlots(userId: string) {
  const now = Date.now();
  const [plots, unlocks, waterCfg] = await Promise.all([
    prisma.playerPlot.findMany({
      where: { userId },
      include: { crop: true, fertilizer: true },
      orderBy: { plotIndex: "asc" },
    }),
    prisma.plotUnlock.findMany(),
    prisma.gameConfig.findUnique({ where: { key: "waterDurationMs" } }),
  ]);
  const waterDurationMs = Number(waterCfg?.value || WATER_DURATION_MS);
  const unlockMap = new Map(unlocks.map((u) => [u.plotIndex, u]));

  const publicPlots: PublicPlot[] = [];

  for (const plot of plots) {
    const grown = applyGrowth(plot, plot.crop, now);
    const changed =
      grown.accumulatedMs !== plot.accumulatedMs ||
      grown.currentStage !== plot.currentStage ||
      grown.fertilizedThisStage !== plot.fertilizedThisStage;

    if (changed) {
      await prisma.playerPlot.update({
        where: { id: plot.id },
        data: {
          accumulatedMs: grown.accumulatedMs,
          currentStage: grown.currentStage,
          lastProcessedAt: grown.lastProcessedAt,
          fertilizedThisStage: grown.fertilizedThisStage,
          fertilizerReducePct: grown.fertilizerReducePct,
          fertilizerId: grown.fertilizerId,
        },
      });
    }

    const unlock = unlockMap.get(plot.plotIndex);
    publicPlots.push({
      plotIndex: plot.plotIndex,
      unlocked: plot.unlocked,
      requiredLevel: unlock?.requiredLevel ?? 1,
      goldCost: unlock?.goldCost ?? 0,
      cropId: plot.cropId,
      cropSlug: plot.crop?.slug ?? null,
      cropName: plot.crop?.name ?? null,
      cropDescription: plot.crop?.description ?? null,
      cropColor: plot.crop?.color ?? null,
      cropAccent: plot.crop?.accent ?? null,
      iconKey: plot.crop?.iconKey ?? null,
      currentStage: grown.currentStage ?? null,
      plantedAt: plot.plantedAt?.toISOString() ?? null,
      wateredUntil: plot.wateredUntil?.toISOString() ?? null,
      fertilizedThisStage: grown.fertilizedThisStage ?? false,
      fertilizerReducePct: grown.fertilizerReducePct ?? 0,
      fertilizerName: grown.fertilizerId ? plot.fertilizer?.name ?? null : null,
      isGrowing: grown.isGrowing,
      remainingMs: grown.remainingMs,
      waterLeftMs: grown.waterLeftMs,
      stageDurationMs: grown.stageDurationMs,
      waterDurationMs,
    });
  }

  return publicPlots;
}

export async function addXp(userId: string, amount: number) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  let xp = user.xp + amount;
  let level = user.level;
  let need = xpToNextLevel(level);
  while (xp >= need && level < 999) {
    xp -= need;
    level += 1;
    need = xpToNextLevel(level);
  }
  return prisma.user.update({
    where: { id: userId },
    data: { xp, level },
  });
}

export async function ensurePlayerWorld(userId: string) {
  const existing = await prisma.playerPlot.count({ where: { userId } });
  if (existing > 0) return;
  const unlocks = await prisma.plotUnlock.findMany();
  await prisma.playerPlot.createMany({
    data: Array.from({ length: TOTAL_PLOTS }, (_, i) => ({
      userId,
      plotIndex: i,
      unlocked: (unlocks.find((u) => u.plotIndex === i)?.requiredLevel ?? 1) <= 1 &&
        (unlocks.find((u) => u.plotIndex === i)?.goldCost ?? 0) === 0,
    })),
  });
}

export function formatMs(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}g ${m}p ${sec}s`;
  if (m > 0) return `${m}p ${sec}s`;
  return `${sec}s`;
}

export function qualityLabel(q: ProduceQuality) {
  switch (q) {
    case ProduceQuality.STAR_0:
      return "0★";
    case ProduceQuality.STAR_1:
      return "1★";
    case ProduceQuality.STAR_2:
      return "2★";
    case ProduceQuality.STAR_3:
      return "3★";
    case ProduceQuality.STAR_4:
      return "4★";
    case ProduceQuality.STAR_5:
      return "5★";
    case ProduceQuality.PREMIUM:
      return "Thượng cấp";
  }
}
