import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { processUserPlots } from "@/lib/game";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { plotIndex, fertilizerId } = await req.json();
  await processUserPlots(user!.id);

  const plot = await prisma.playerPlot.findUnique({
    where: { userId_plotIndex: { userId: user!.id, plotIndex } },
  });
  if (!plot?.unlocked || !plot.cropId) return jsonError("Không có cây để bón");
  if (plot.currentStage === "RIPE") return jsonError("Cây đã chín");
  if (plot.fertilizedThisStage) return jsonError("Giai đoạn này đã bón phân");

  const fert = await prisma.fertilizer.findUnique({ where: { id: fertilizerId } });
  if (!fert?.enabled) return jsonError("Phân bón không hợp lệ");

  const now = new Date();
  try {
    await prisma.$transaction(async (tx) => {
      const fresh = await tx.user.findUniqueOrThrow({ where: { id: user!.id } });
      if (fresh.gold < fert.price) throw new Error("Không đủ vàng");
      await tx.user.update({
        where: { id: user!.id },
        data: { gold: { decrement: fert.price } },
      });
      await tx.playerPlot.update({
        where: { id: plot.id },
        data: {
          fertilizedThisStage: true,
          fertilizerReducePct: fert.timeReducePercent,
          fertilizerId: fert.id,
          lastProcessedAt: now,
        },
      });
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Không bón được");
  }

  return NextResponse.json({ ok: true });
}
