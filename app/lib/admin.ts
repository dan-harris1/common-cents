import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

// Single-author login: the author enters ADMIN_PASSWORD once and gets a cookie
// holding an HMAC derived from it. Changing the password signs everyone out.
export const ADMIN_COOKIE = "cc-admin";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function adminToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHmac("sha256", password).update("common-cents-admin").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function checkPassword(password: string): string | null {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !safeEqual(password, expected)) return null;
  return adminToken();
}

export function isAdmin(req: NextRequest): boolean {
  const token = adminToken();
  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  return !!token && !!cookie && safeEqual(cookie, token);
}

export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}
