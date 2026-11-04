import { ProduceQuality } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { sellPriceFor } from "@/lib/game";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { fishId, quality, quantity } = await req.json();
  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
  if (!Object.values(ProduceQuality).includes(quality)) return jsonError("Phẩm chất không hợp lệ");

  const item = await prisma.fishInventory.findUnique({
    where: { userId_fishId_quality: { userId: user!.id, fishId: String(fishId), quality } },
    include: { fish: true },
  });
  if (!item || item.quantity < qty) return jsonError("Không đủ cá trong kho");

  const gold = sellPriceFor(item.fish, quality) * qty;
  const sold = await prisma.$transaction(async (tx) => {
    const r = await tx.fishInventory.updateMany({
      where: { id: item.id, quantity: { gte: qty } },
      data: { quantity: { decrement: qty } },
    });
    if (r.count === 0) return false;
    await tx.user.update({ where: { id: user!.id }, data: { gold: { increment: gold } } });
    return true;
  });
  if (!sold) return jsonError("Không đủ cá trong kho");

  return NextResponse.json({ ok: true, gold });
}
