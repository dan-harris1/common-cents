import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword) {
    return NextResponse.json(
      { error: "Site password is not configured" },
      { status: 500 }
    );
  }

  if (password === sitePassword) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
}
