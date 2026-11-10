import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { checkRateLimit, createQuestion, listQuestions } from "../../lib/redis";
import { clientIp, isAdmin } from "../../lib/admin";

const MAX_QUESTION_LENGTH = 500;
const MAX_NAME_LENGTH = 60;

// Reader input is shown as plain text; tags are stripped so nothing
// markup-looking is stored.
function clean(text: string, max: number): string {
  return text.replace(/<[^>]*>/g, "").trim().slice(0, max);
}

export async function GET(req: NextRequest) {
  const admin = isAdmin(req);
  const questions = await listQuestions();
  return Response.json(admin ? questions : questions.filter((q) => !q.hidden));
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { text?: string; name?: string; website?: string };

  // Honeypot: the "website" field is hidden from people, so only bots fill it.
  if (body.website) {
    return Response.json({ error: "Invalid submission" }, { status: 400 });
  }

  const text = clean(body.text || "", MAX_QUESTION_LENGTH);
  if (!text) {
    return Response.json({ error: "Please enter a question" }, { status: 400 });
  }
  const name = clean(body.name || "", MAX_NAME_LENGTH) || "Anonymous";

  if (!(await checkRateLimit(`question:${clientIp(req)}`, 3, 60 * 60))) {
    return Response.json(
      { error: "You've posted several questions recently. Please try again in an hour." },
      { status: 429 }
    );
  }

  const question = await createQuestion(randomUUID(), text, name);
  return Response.json(question);
}
