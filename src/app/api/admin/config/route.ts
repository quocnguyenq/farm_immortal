import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const config = await prisma.gameConfig.findMany();
  return NextResponse.json({ config });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { items } = await req.json();
  await prisma.$transaction(
    items.map((i: { key: string; value: string }) =>
      prisma.gameConfig.upsert({
        where: { key: i.key },
        update: { value: String(i.value) },
        create: { key: i.key, value: String(i.value) },
      }),
    ),
  );
  return NextResponse.json({ ok: true });
}
