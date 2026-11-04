import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const unlocks = await prisma.plotUnlock.findMany({ orderBy: { plotIndex: "asc" } });
  return NextResponse.json({ unlocks });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { unlocks } = await req.json();
  await prisma.$transaction(
    unlocks.map((u: { plotIndex: number; requiredLevel: number; goldCost: number; enabled: boolean }) =>
      prisma.plotUnlock.update({
        where: { plotIndex: u.plotIndex },
        data: {
          requiredLevel: Number(u.requiredLevel),
          goldCost: Number(u.goldCost),
          enabled: u.enabled,
        },
      }),
    ),
  );
  return NextResponse.json({ ok: true });
}
