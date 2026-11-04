import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const fertilizers = await prisma.fertilizer.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ fertilizers });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const data = await req.json();
  const fertilizer = await prisma.fertilizer.update({
    where: { id: data.id },
    data: {
      name: data.name,
      description: data.description,
      timeReducePercent: Number(data.timeReducePercent),
      price: Number(data.price),
      enabled: data.enabled,
      sortOrder: Number(data.sortOrder),
    },
  });
  return NextResponse.json({ fertilizer });
}
