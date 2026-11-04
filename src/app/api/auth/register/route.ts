import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie, signSession } from "@/lib/auth";
import { ensurePlayerWorld } from "@/lib/game";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = String(body?.username || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const displayName = String(body?.displayName || username).trim();

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return NextResponse.json({ error: "Tài khoản 3-20 ký tự, chỉ chữ số và gạch dưới" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return NextResponse.json({ error: "Tài khoản đã tồn tại" }, { status: 409 });

  const startGold = Number((await prisma.gameConfig.findUnique({ where: { key: "startGold" } }))?.value || 2000);

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash: await hashPassword(password),
      displayName: displayName || username,
      gold: startGold,
    },
  });
  await ensurePlayerWorld(user.id);

  const rice = await prisma.crop.findUnique({ where: { slug: "lua" } });
  const carrot = await prisma.crop.findUnique({ where: { slug: "ca-rot" } });
  if (rice) await prisma.playerSeed.create({ data: { userId: user.id, cropId: rice.id, quantity: 6 } });
  if (carrot) await prisma.playerSeed.create({ data: { userId: user.id, cropId: carrot.id, quantity: 6 } });

  await setSessionCookie(await signSession(user.id));
  return NextResponse.json({ ok: true });
}
