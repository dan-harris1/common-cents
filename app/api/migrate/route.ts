import { migrateMessageSender, redis } from "../../lib/redis";

export async function POST() {
  // Reset users to new defaults
  await redis.del("users");

  // Attribute all existing user messages to Daniel
  const count = await migrateMessageSender("Daniel");

  return Response.json({ migrated: count });
}
