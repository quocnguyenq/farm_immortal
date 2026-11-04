export type FishStageId = "FRY" | "SMALL" | "ADULT";

export const FISH_STAGES: FishStageId[] = ["FRY", "SMALL", "ADULT"];

export function fishStageLabel(stage: FishStageId) {
  switch (stage) {
    case "FRY":
      return "Cá giống";
    case "SMALL":
      return "Cá nhỏ";
    case "ADULT":
      return "Cá trưởng thành";
  }
}

/** Tỷ lệ kích thước hiển thị theo giai đoạn. */
export function fishStageScale(stage: FishStageId) {
  return stage === "FRY" ? 0.42 : stage === "SMALL" ? 0.68 : 1;
}
