import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  model: string;
  respondedModel?: string;
  warning?: string;
}

export interface Chat {
  id: string;
  title: string;
  model: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const CHAT_PREFIX = "chat:";
const CHAT_INDEX = "chats";

export async function createChat(
  id: string,
  title: string,
  model: string,
  messages: ChatMessage[]
): Promise<Chat> {
  const now = Date.now();
  const chat: Chat = { id, title, model, messages, createdAt: now, updatedAt: now };
  await redis.set(`${CHAT_PREFIX}${id}`, JSON.stringify(chat));
  await redis.zadd(CHAT_INDEX, { score: now, member: id });
  return chat;
}

export async function getChat(id: string): Promise<Chat | null> {
  const data = await redis.get<string>(`${CHAT_PREFIX}${id}`);
  if (!data) return null;
  return typeof data === "string" ? JSON.parse(data) : data;
}

export async function addMessages(
  id: string,
  newMessages: ChatMessage[]
): Promise<Chat | null> {
  const chat = await getChat(id);
  if (!chat) return null;
  chat.messages.push(...newMessages);
  chat.updatedAt = Date.now();
  await redis.set(`${CHAT_PREFIX}${id}`, JSON.stringify(chat));
  await redis.zadd(CHAT_INDEX, { score: chat.updatedAt, member: id });
  return chat;
}

export async function deleteChat(id: string): Promise<void> {
  await redis.del(`${CHAT_PREFIX}${id}`);
  await redis.zrem(CHAT_INDEX, id);
}

export async function listChats(): Promise<
  { id: string; title: string; model: string; updatedAt: number }[]
> {
  const ids = await redis.zrange<string[]>(CHAT_INDEX, 0, -1, { rev: true });
  if (!ids.length) return [];
  const pipeline = redis.pipeline();
  for (const id of ids) {
    pipeline.get(`${CHAT_PREFIX}${id}`);
  }
  const results = await pipeline.exec();
  return results
    .map((raw) => {
      if (!raw) return null;
      const chat: Chat = typeof raw === "string" ? JSON.parse(raw) : (raw as Chat);
      return { id: chat.id, title: chat.title, model: chat.model, updatedAt: chat.updatedAt };
    })
    .filter(Boolean) as { id: string; title: string; model: string; updatedAt: number }[];
}
