import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { plotIndex } = await req.json();

  const plot = await prisma.playerPlot.findUnique({
    where: { userId_plotIndex: { userId: user!.id, plotIndex } },
  });
  if (!plot) return jsonError("Ô không tồn tại");
  if (plot.unlocked) return jsonError("Ô đã mở");

  const unlock = await prisma.plotUnlock.findUnique({ where: { plotIndex } });
  if (!unlock?.enabled) return jsonError("Ô này chưa cho phép mở");

  const fresh = await prisma.user.findUniqueOrThrow({ where: { id: user!.id } });
  if (fresh.level < unlock.requiredLevel) {
    return jsonError(`Cần đạt cấp ${unlock.requiredLevel}`);
  }
  if (fresh.gold < unlock.goldCost) return jsonError("Không đủ vàng");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: fresh.id },
      data: { gold: { decrement: unlock.goldCost } },
    }),
    prisma.playerPlot.update({
      where: { id: plot.id },
      data: { unlocked: true },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
