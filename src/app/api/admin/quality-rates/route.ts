import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const rates = await prisma.qualityRate.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ rates });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { rates } = await req.json();
  const total = rates.reduce((s: number, r: { chanceBps: number }) => s + Number(r.chanceBps), 0);
  if (total !== 10000) return jsonError("Tổng tỷ lệ phải đúng 10000 bps (100.00%)");
  await prisma.$transaction(
    rates.map((r: { id: string; chanceBps: number; label: string }) =>
      prisma.qualityRate.update({
        where: { id: r.id },
        data: { chanceBps: Number(r.chanceBps), label: r.label },
      }),
    ),
  );
  return NextResponse.json({ ok: true });
}
