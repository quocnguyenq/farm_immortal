import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { processUserPlots, WATER_DURATION_MS } from "@/lib/game";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { plotIndex } = await req.json();
  await processUserPlots(user!.id);

  const plot = await prisma.playerPlot.findUnique({
    where: { userId_plotIndex: { userId: user!.id, plotIndex } },
  });
  if (!plot?.unlocked || !plot.cropId) return jsonError("Không có cây để tưới");
  if (plot.currentStage === "RIPE") return jsonError("Cây đã chín, hãy thu hoạch");

  const cfg = await prisma.gameConfig.findUnique({ where: { key: "waterDurationMs" } });
  const duration = Number(cfg?.value || WATER_DURATION_MS);
  const now = new Date();

  await prisma.playerPlot.update({
    where: { id: plot.id },
    data: {
      wateredUntil: new Date(now.getTime() + duration),
      lastProcessedAt: now,
    },
  });

  return NextResponse.json({ ok: true, wateredUntil: new Date(now.getTime() + duration) });
}
