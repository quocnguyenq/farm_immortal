import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { fertilizerId } = await req.json();
  const fert = await prisma.fertilizer.findUnique({ where: { id: fertilizerId } });
  if (!fert?.enabled) return jsonError("Phân bón không hợp lệ");
  return NextResponse.json({
    ok: true,
    note: "Phân bón hiện mua trực tiếp khi bón (trừ vàng). Kho phân sẽ bổ sung sau.",
    fertilizer: fert,
  });
}
