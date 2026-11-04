import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ensurePond, pondCapacity } from "@/lib/pond";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { fishId, quantity } = await req.json();
  const qty = Math.min(50, Math.max(1, Math.floor(Number(quantity) || 1)));

  const fish = await prisma.fish.findUnique({ where: { id: String(fishId) } });
  if (!fish || !fish.enabled) return jsonError("Loài cá không tồn tại");
  const me = await prisma.user.findUniqueOrThrow({ where: { id: user!.id } });
  if (me.level < fish.unlockLevel) return jsonError(`Cần cấp ${fish.unlockLevel}`);

  const pond = await ensurePond(user!.id);
  const capacity = await pondCapacity(pond.level);
  const count = await prisma.playerFish.count({ where: { userId: user!.id } });
  if (count + qty > capacity) return jsonError(`Ao chỉ còn ${Math.max(0, capacity - count)} chỗ. Hãy nâng cấp ao.`);

  const cost = fish.price * qty;
  try {
    await prisma.$transaction(async (tx) => {
      const paid = await tx.user.updateMany({
        where: { id: user!.id, gold: { gte: cost } },
        data: { gold: { decrement: cost } },
      });
      if (paid.count === 0) throw new Error("Không đủ vàng");
      await tx.playerFish.createMany({
        data: Array.from({ length: qty }, () => ({ userId: user!.id, fishId: fish.id })),
      });
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Không mua được");
  }

  return NextResponse.json({ ok: true, name: fish.name, quantity: qty, cost });
}
