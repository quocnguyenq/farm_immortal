import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const crops = await prisma.crop.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ crops });
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const data = await req.json();
  const crop = await prisma.crop.create({
    data: {
      slug: data.slug,
      name: data.name,
      description: data.description || "",
      enabled: data.enabled ?? true,
      sortOrder: Number(data.sortOrder || 0),
      unlockLevel: Number(data.unlockLevel || 1),
      seedPrice: Number(data.seedPrice || 10),
      xpReward: Number(data.xpReward || 5),
      harvestMin: Number(data.harvestMin || 1),
      harvestMax: Number(data.harvestMax || 3),
      durationSeedMs: Number(data.durationSeedMs),
      durationSproutMs: Number(data.durationSproutMs),
      durationGrowMs: Number(data.durationGrowMs),
      sellStar0: Number(data.sellStar0 || 0),
      sellStar1: Number(data.sellStar1 || 0),
      sellStar2: Number(data.sellStar2 || 0),
      sellStar3: Number(data.sellStar3 || 0),
      sellStar4: Number(data.sellStar4 || 0),
      sellStar5: Number(data.sellStar5 || 0),
      sellPremium: Number(data.sellPremium || 0),
      color: data.color || "#7cb342",
      accent: data.accent || "#f4d03f",
      iconKey: data.iconKey || "leaf",
    },
  });
  return NextResponse.json({ crop });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const data = await req.json();
  if (!data.id) return jsonError("Thiếu id");
  const crop = await prisma.crop.update({
    where: { id: data.id },
    data: {
      name: data.name,
      description: data.description,
      enabled: data.enabled,
      sortOrder: Number(data.sortOrder),
      unlockLevel: Number(data.unlockLevel),
      seedPrice: Number(data.seedPrice),
      xpReward: Number(data.xpReward),
      harvestMin: Number(data.harvestMin),
      harvestMax: Number(data.harvestMax),
      durationSeedMs: Number(data.durationSeedMs),
      durationSproutMs: Number(data.durationSproutMs),
      durationGrowMs: Number(data.durationGrowMs),
      sellStar0: Number(data.sellStar0),
      sellStar1: Number(data.sellStar1),
      sellStar2: Number(data.sellStar2),
      sellStar3: Number(data.sellStar3),
      sellStar4: Number(data.sellStar4),
      sellStar5: Number(data.sellStar5),
      sellPremium: Number(data.sellPremium),
      color: data.color,
      accent: data.accent,
      iconKey: data.iconKey,
    },
  });
  return NextResponse.json({ crop });
}
