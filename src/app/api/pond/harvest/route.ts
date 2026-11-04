import { FishStage, type ProduceQuality } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { addXp } from "@/lib/game";
import { prisma } from "@/lib/prisma";
import { agingStrength, fishOdds, fishStageAt, rollFromOdds } from "@/lib/pond";

/** Thu 1 con (id) hoặc toàn bộ cá trưởng thành (all = true). */
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id, all } = await req.json();
  const now = Date.now();

  const owned = await prisma.playerFish.findMany({
    where: { userId: user!.id, ...(all ? {} : { id: String(id) }) },
    include: { fish: true },
  });
  const ready = owned.filter((pf) => fishStageAt(pf.fish, pf.boughtAt, now).stage === FishStage.ADULT);
  if (ready.length === 0) return jsonError(all ? "Chưa có cá trưởng thành" : "Cá chưa trưởng thành");

  const [rates, strength] = await Promise.all([prisma.qualityRate.findMany(), agingStrength()]);
  const results: { name: string; quality: ProduceQuality }[] = [];
  let xp = 0;

  await prisma.$transaction(async (tx) => {
    for (const pf of ready) {
      const { aging } = fishStageAt(pf.fish, pf.boughtAt, now);
      const quality = rollFromOdds(fishOdds(rates, aging, strength));
      const removed = await tx.playerFish.deleteMany({ where: { id: pf.id, userId: user!.id } });
      if (removed.count === 0) continue;
      await tx.fishInventory.upsert({
        where: { userId_fishId_quality: { userId: user!.id, fishId: pf.fishId, quality } },
        update: { quantity: { increment: 1 } },
        create: { userId: user!.id, fishId: pf.fishId, quality, quantity: 1 },
      });
      results.push({ name: pf.fish.name, quality });
      xp += pf.fish.xpReward;
    }
  });

  if (xp > 0) await addXp(user!.id, xp);
  return NextResponse.json({ ok: true, results });
}
