import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, signSession, verifyPassword } from "@/lib/auth";
import { ensurePlayerWorld } from "@/lib/game";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = String(body?.username || "").trim().toLowerCase();
  const password = String(body?.password || "");

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Sai tài khoản hoặc mật khẩu" }, { status: 401 });
  }
  await ensurePlayerWorld(user.id);
  await setSessionCookie(await signSession(user.id));
  return NextResponse.json({ ok: true, isAdmin: user.isAdmin });
}
