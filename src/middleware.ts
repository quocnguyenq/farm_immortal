import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("farm_session")?.value;
  let loggedIn = false;
  if (token) {
    try {
      await jwtVerify(token, secret);
      loggedIn = true;
    } catch {
      loggedIn = false;
    }
  }

  if ((pathname.startsWith("/play") || pathname.startsWith("/admin")) && !loggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if ((pathname === "/login" || pathname === "/register" || pathname === "/") && loggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/play";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register", "/play/:path*", "/admin/:path*"],
};
