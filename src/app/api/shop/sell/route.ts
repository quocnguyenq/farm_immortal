import { ProduceQuality } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { sellPriceFor } from "@/lib/game";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { cropId, quality, quantity } = await req.json();
  const qty = Math.max(1, Number(quantity) || 1);
  if (!Object.values(ProduceQuality).includes(quality)) return jsonError("Phẩm chất không hợp lệ");

  const item = await prisma.inventoryItem.findUnique({
    where: { userId_cropId_quality: { userId: user!.id, cropId, quality } },
    include: { crop: true },
  });
  if (!item || item.quantity < qty) return jsonError("Không đủ sản lượng");

  const gold = sellPriceFor(item.crop, quality) * qty;
  await prisma.$transaction([
    prisma.inventoryItem.update({
      where: { id: item.id },
      data: { quantity: { decrement: qty } },
    }),
    prisma.user.update({
      where: { id: user!.id },
      data: { gold: { increment: gold } },
    }),
  ]);

  return NextResponse.json({ ok: true, gold });
}
