import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const INT_FIELDS = [
  "sortOrder",
  "unlockLevel",
  "price",
  "xpReward",
  "durationFryMs",
  "durationSmallMs",
  "agingMaxMs",
  "sellStar0",
  "sellStar1",
  "sellStar2",
  "sellStar3",
  "sellStar4",
  "sellStar5",
  "sellPremium",
] as const;

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const fish = await prisma.fish.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ fish });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const data = await req.json();
  if (!data.id) return jsonError("Thiếu id");
  const ints: Record<string, number> = {};
  for (const f of INT_FIELDS) {
    const v = Math.floor(Number(data[f]));
    if (!Number.isFinite(v) || v < 0) return jsonError(`${f} không hợp lệ`);
    ints[f] = v;
  }
  const sizeScale = Number(data.sizeScale);
  const fish = await prisma.fish.update({
    where: { id: data.id },
    data: {
      ...ints,
      name: String(data.name),
      description: String(data.description ?? ""),
      enabled: Boolean(data.enabled),
      swimStyle: String(data.swimStyle),
      sizeScale: Number.isFinite(sizeScale) && sizeScale > 0 ? sizeScale : 1,
    },
  });
  return NextResponse.json({ fish });
}
