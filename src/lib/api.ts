import { NextResponse } from "next/server";
import { getSessionUser } from "./auth";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) return { user: null, error: jsonError("Chưa đăng nhập", 401) };
  return { user, error: null };
}

export async function requireAdmin() {
  const { user, error } = await requireUser();
  if (error) return { user: null, error };
  if (!user!.isAdmin) return { user: null, error: jsonError("Không có quyền admin", 403) };
  return { user, error: null };
}
