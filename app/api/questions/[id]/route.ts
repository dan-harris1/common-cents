import { NextRequest } from "next/server";
import { getQuestion, saveQuestion } from "../../../lib/redis";
import { isAdmin } from "../../../lib/admin";

const MAX_ANSWER_LENGTH = 10000;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const question = await getQuestion(id);
  if (!question || (question.hidden && !isAdmin(req))) {
    return Response.json({ error: "Question not found" }, { status: 404 });
  }
  return Response.json(question);
}

// Author only. `answer: string` posts or edits the answer, `answer: null`
// deletes it, and `hidden` hides or restores the question.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Not authorized" }, { status: 401 });
  }
  const { id } = await params;
  const question = await getQuestion(id);
  if (!question) {
    return Response.json({ error: "Question not found" }, { status: 404 });
  }

  const body = (await req.json()) as { answer?: string | null; hidden?: boolean };

  if (body.answer !== undefined) {
    const answer = body.answer?.trim().slice(0, MAX_ANSWER_LENGTH);
    if (answer) {
      question.answer = answer;
      question.answeredAt = Date.now();
      question.status = "answered";
    } else {
      delete question.answer;
      delete question.answeredAt;
      question.status = "awaiting";
    }
  }
  if (typeof body.hidden === "boolean") {
    question.hidden = body.hidden;
  }

  await saveQuestion(question);
  return Response.json(question);
}
