import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { addXp, processUserPlots, rollQuality } from "@/lib/game";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { plotIndex } = await req.json();
  const plots = await processUserPlots(user!.id);
  const live = plots.find((p) => p.plotIndex === plotIndex);
  if (!live?.unlocked || !live.cropId) return jsonError("Ô trống");
  if (live.currentStage !== "RIPE") return jsonError("Cây chưa tới giai đoạn thu hoạch");

  const crop = await prisma.crop.findUnique({ where: { id: live.cropId } });
  if (!crop) return jsonError("Cây không tồn tại");
  const rates = await prisma.qualityRate.findMany();
  const quality = rollQuality(rates);
  const qty =
    crop.harvestMin + Math.floor(Math.random() * (crop.harvestMax - crop.harvestMin + 1));

  await prisma.$transaction(async (tx) => {
    await tx.inventoryItem.upsert({
      where: {
        userId_cropId_quality: {
          userId: user!.id,
          cropId: crop.id,
          quality,
        },
      },
      update: { quantity: { increment: qty } },
      create: { userId: user!.id, cropId: crop.id, quality, quantity: qty },
    });
    await tx.playerPlot.update({
      where: { userId_plotIndex: { userId: user!.id, plotIndex } },
      data: {
        cropId: null,
        plantedAt: null,
        currentStage: null,
        accumulatedMs: 0,
        lastProcessedAt: null,
        wateredUntil: null,
        fertilizedThisStage: false,
        fertilizerReducePct: 0,
        fertilizerId: null,
      },
    });
  });

  await addXp(user!.id, crop.xpReward);

  return NextResponse.json({
    ok: true,
    cropName: crop.name,
    quantity: qty,
    quality,
  });
}
