import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE, checkPassword, clientIp, isAdmin } from "../../lib/admin";
import { checkRateLimit } from "../../lib/redis";

export async function GET(req: NextRequest) {
  return NextResponse.json({ admin: isAdmin(req) });
}

export async function POST(req: NextRequest) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Author login is not configured" }, { status: 500 });
  }
  if (!(await checkRateLimit(`login:${clientIp(req)}`, 10, 15 * 60))) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const { password } = (await req.json()) as { password?: string };
  const token = checkPassword(password || "");
  if (!token) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const res = NextResponse.json({ admin: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ admin: false });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
