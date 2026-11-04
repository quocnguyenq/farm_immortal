import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { cropId, quantity } = await req.json();
  const qty = Math.max(1, Math.min(99, Number(quantity) || 1));

  const crop = await prisma.crop.findUnique({ where: { id: cropId } });
  if (!crop?.enabled) return jsonError("Hạt giống không bán");
  const fresh = await prisma.user.findUniqueOrThrow({ where: { id: user!.id } });
  if (fresh.level < crop.unlockLevel) return jsonError(`Cần cấp ${crop.unlockLevel}`);
  const cost = crop.seedPrice * qty;
  if (fresh.gold < cost) return jsonError("Không đủ vàng");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: fresh.id },
      data: { gold: { decrement: cost } },
    }),
    prisma.playerSeed.upsert({
      where: { userId_cropId: { userId: fresh.id, cropId: crop.id } },
      update: { quantity: { increment: qty } },
      create: { userId: fresh.id, cropId: crop.id, quantity: qty },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
