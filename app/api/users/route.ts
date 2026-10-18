import { NextRequest } from "next/server";
import { getUsers, updateUserColor } from "../../lib/redis";

export async function GET() {
  const users = await getUsers();
  return Response.json(users);
}

export async function PATCH(req: NextRequest) {
  const { name, color } = (await req.json()) as { name: string; color: string };
  if (!name || !color) {
    return Response.json({ error: "name and color required" }, { status: 400 });
  }
  const users = await updateUserColor(name, color);
  if (!users) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }
  return Response.json(users);
}
