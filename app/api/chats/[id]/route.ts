import { getChat, deleteChat } from "../../../lib/redis";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const chat = await getChat(id);
  if (!chat) {
    return Response.json({ error: "Chat not found" }, { status: 404 });
  }
  return Response.json(chat);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteChat(id);
  return Response.json({ ok: true });
}
