import { NextRequest } from "next/server";
import { addMessages, type ChatMessage } from "../../../../lib/redis";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { messages } = (await req.json()) as { messages: ChatMessage[] };

  if (!messages?.length) {
    return Response.json({ error: "messages required" }, { status: 400 });
  }

  const chat = await addMessages(id, messages);
  if (!chat) {
    return Response.json({ error: "Chat not found" }, { status: 404 });
  }
  return Response.json(chat);
}
