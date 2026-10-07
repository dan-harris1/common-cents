import { NextRequest } from "next/server";
import { createChat, listChats, type ChatMessage } from "../../lib/redis";
import { randomUUID } from "crypto";

export async function GET() {
  const chats = await listChats();
  return Response.json(chats);
}

export async function POST(req: NextRequest) {
  const { model, messages } = (await req.json()) as {
    model: string;
    messages: ChatMessage[];
  };

  if (!model || !messages?.length) {
    return Response.json({ error: "model and messages required" }, { status: 400 });
  }

  const id = randomUUID();
  const firstUserMsg = messages.find((m) => m.role === "user");
  const title = firstUserMsg
    ? firstUserMsg.content.slice(0, 100)
    : "New Chat";

  const chat = await createChat(id, title, model, messages);
  return Response.json(chat);
}
