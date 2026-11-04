import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { xpToNextLevel } from "@/lib/game";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  return NextResponse.json({
    ...user,
    xpToNext: xpToNextLevel(user!.level),
  });
}
