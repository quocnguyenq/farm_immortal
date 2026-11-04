import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const levels = await prisma.pondLevel.findMany({ orderBy: { level: "asc" } });
  return NextResponse.json({ levels });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { levels } = await req.json();
  if (!Array.isArray(levels) || levels.length === 0) return jsonError("Thiếu danh sách cấp ao");
  const rows = levels.map((l: Record<string, unknown>) => ({
    level: Math.floor(Number(l.level)),
    capacity: Math.floor(Number(l.capacity)),
    requiredLevel: Math.floor(Number(l.requiredLevel)),
    goldCost: Math.floor(Number(l.goldCost)),
  }));
  if (rows.some((r) => Object.values(r).some((v) => !Number.isFinite(v) || v < 0) || r.level < 1 || r.capacity < 1))
    return jsonError("Giá trị không hợp lệ");
  await prisma.$transaction(
    rows.map((r) => prisma.pondLevel.upsert({ where: { level: r.level }, update: r, create: r })),
  );
  return NextResponse.json({ ok: true });
}
