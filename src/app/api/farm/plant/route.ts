import { CropStage } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { processUserPlots } from "@/lib/game";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { plotIndex, cropId } = await req.json();
  await processUserPlots(user!.id);

  const plot = await prisma.playerPlot.findUnique({
    where: { userId_plotIndex: { userId: user!.id, plotIndex } },
  });
  if (!plot?.unlocked) return jsonError("Ô đất chưa mở");
  if (plot.cropId) return jsonError("Ô này đang có cây");

  const crop = await prisma.crop.findUnique({ where: { id: cropId } });
  if (!crop?.enabled) return jsonError("Hạt giống không hợp lệ");
  if (user!.level < crop.unlockLevel) return jsonError(`Cần cấp ${crop.unlockLevel} để trồng ${crop.name}`);

  const seed = await prisma.playerSeed.findUnique({
    where: { userId_cropId: { userId: user!.id, cropId } },
  });
  if (!seed || seed.quantity < 1) return jsonError("Không đủ hạt giống");

  const now = new Date();
  await prisma.$transaction([
    prisma.playerSeed.update({
      where: { id: seed.id },
      data: { quantity: { decrement: 1 } },
    }),
    prisma.playerPlot.update({
      where: { id: plot.id },
      data: {
        cropId: crop.id,
        plantedAt: now,
        currentStage: CropStage.SEED,
        accumulatedMs: 0,
        lastProcessedAt: now,
        wateredUntil: null,
        fertilizedThisStage: false,
        fertilizerReducePct: 0,
        fertilizerId: null,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
