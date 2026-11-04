import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const players = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      displayName: true,
      isAdmin: true,
      gold: true,
      xp: true,
      level: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ players });
}
