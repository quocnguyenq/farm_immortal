import type { CropStage, FertilizerGrade, ProduceQuality } from "@prisma/client";
import type { PublicPlot } from "./game";
import type { PondState, PublicFish } from "./pond";

export type FarmUser = {
  id: string;
  username: string;
  displayName: string;
  isAdmin: boolean;
  gold: number;
  xp: number;
  level: number;
  energy: number;
  energyMax: number;
  xpToNext: number;
};

export type FarmSeed = {
  cropId: string;
  quantity: number;
  name: string;
  slug: string;
  color: string;
  unlockLevel: number;
  iconKey: string;
};

export type FarmFertilizer = {
  id: string;
  name: string;
  grade: FertilizerGrade;
  timeReducePercent: number;
  price: number;
  description: string;
};

export type FarmInventory = {
  id: string;
  cropId: string;
  cropName: string;
  slug: string;
  color: string;
  quality: ProduceQuality;
  quantity: number;
  sellPrice: number;
};

export type ShopCrop = {
  id: string;
  slug: string;
  name: string;
  description: string;
  seedPrice: number;
  unlockLevel: number;
  color: string;
  accent: string;
  iconKey: string;
  durationSeedMs: number;
  durationSproutMs: number;
  durationGrowMs: number;
};

export type ShopFish = {
  id: string;
  name: string;
  description: string;
  iconKey: string;
  price: number;
  unlockLevel: number;
  durationFryMs: number;
  durationSmallMs: number;
  agingMaxMs: number;
};

export type FishInventoryItem = {
  id: string;
  fishId: string;
  name: string;
  iconKey: string;
  quality: ProduceQuality;
  quantity: number;
  sellPrice: number;
};

export type FarmState = {
  user: FarmUser;
  plots: PublicPlot[];
  seeds: FarmSeed[];
  fertilizers: FarmFertilizer[];
  inventory: FarmInventory[];
  shopCrops: ShopCrop[];
  pond: PondState;
  shopFish: ShopFish[];
  fishInventory: FishInventoryItem[];
};

export type { CropStage, PublicPlot, PondState, PublicFish };
