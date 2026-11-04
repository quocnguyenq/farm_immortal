import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { processUserPlots, sellPriceFor, xpToNextLevel } from "@/lib/game";
import { getPondState } from "@/lib/pond";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const plots = await processUserPlots(user!.id);
  const [pond, fishes, fishInventory] = await Promise.all([
    getPondState(user!.id),
    prisma.fish.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" } }),
    prisma.fishInventory.findMany({
      where: { userId: user!.id, quantity: { gt: 0 } },
      include: { fish: true },
      orderBy: [{ fish: { sortOrder: "asc" } }, { quality: "asc" }],
    }),
  ]);
  const [seeds, fertilizers, inventory, crops] = await Promise.all([
    prisma.playerSeed.findMany({
      where: { userId: user!.id, quantity: { gt: 0 } },
      include: { crop: true },
    }),
    prisma.fertilizer.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" } }),
    prisma.inventoryItem.findMany({
      where: { userId: user!.id, quantity: { gt: 0 } },
      include: { crop: true },
      orderBy: [{ cropId: "asc" }, { quality: "asc" }],
    }),
    prisma.crop.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  const fresh = await prisma.user.findUniqueOrThrow({ where: { id: user!.id } });

  return NextResponse.json({
    user: {
      id: fresh.id,
      username: fresh.username,
      displayName: fresh.displayName,
      isAdmin: fresh.isAdmin,
      gold: fresh.gold,
      xp: fresh.xp,
      level: fresh.level,
      energy: fresh.energy,
      energyMax: fresh.energyMax,
      xpToNext: xpToNextLevel(fresh.level),
    },
    plots,
    seeds: seeds.map((s) => ({
      cropId: s.cropId,
      quantity: s.quantity,
      name: s.crop.name,
      slug: s.crop.slug,
      color: s.crop.color,
      unlockLevel: s.crop.unlockLevel,
      iconKey: s.crop.iconKey,
    })),
    fertilizers,
    inventory: inventory.map((i) => ({
      id: i.id,
      cropId: i.cropId,
      cropName: i.crop.name,
      slug: i.crop.slug,
      color: i.crop.color,
      quality: i.quality,
      quantity: i.quantity,
      sellPrice: sellPriceFor(i.crop, i.quality),
    })),
    pond,
    shopFish: fishes.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      iconKey: f.iconKey,
      price: f.price,
      unlockLevel: f.unlockLevel,
      durationFryMs: f.durationFryMs,
      durationSmallMs: f.durationSmallMs,
      agingMaxMs: f.agingMaxMs,
    })),
    fishInventory: fishInventory.map((i) => ({
      id: i.id,
      fishId: i.fishId,
      name: i.fish.name,
      iconKey: i.fish.iconKey,
      quality: i.quality,
      quantity: i.quantity,
      sellPrice: sellPriceFor(i.fish, i.quality),
    })),
    shopCrops: crops.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      seedPrice: c.seedPrice,
      unlockLevel: c.unlockLevel,
      color: c.color,
      accent: c.accent,
      iconKey: c.iconKey,
      durationSeedMs: c.durationSeedMs,
      durationSproutMs: c.durationSproutMs,
      durationGrowMs: c.durationGrowMs,
    })),
  });
}
