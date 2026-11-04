import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ensurePond } from "@/lib/pond";

export async function POST() {
  const { user, error } = await requireUser();
  if (error) return error;
  const pond = await ensurePond(user!.id);
  const next = await prisma.pondLevel.findUnique({ where: { level: pond.level + 1 } });
  if (!next) return jsonError("Ao đã đạt cấp tối đa");
  const me = await prisma.user.findUniqueOrThrow({ where: { id: user!.id } });
  if (me.level < next.requiredLevel) return jsonError(`Cần nhân vật cấp ${next.requiredLevel}`);

  try {
    await prisma.$transaction(async (tx) => {
      const paid = await tx.user.updateMany({
        where: { id: user!.id, gold: { gte: next.goldCost } },
        data: { gold: { decrement: next.goldCost } },
      });
      if (paid.count === 0) throw new Error("Không đủ vàng");
      const moved = await tx.playerPond.updateMany({
        where: { userId: user!.id, level: pond.level },
        data: { level: next.level },
      });
      if (moved.count === 0) throw new Error("Ao vừa được nâng cấp, thử lại");
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Không nâng cấp được");
  }

  return NextResponse.json({ ok: true, level: next.level, capacity: next.capacity });
}
