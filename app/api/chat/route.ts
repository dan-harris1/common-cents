import { NextRequest, NextResponse } from "next/server";
import { getVectorIndex } from "../../lib/vector";
import { TERMS } from "../../glossary-terms";

const SYSTEM_PROMPT = `You are the companion to "Common Cents," a book on the philosophy of money, on a website where readers explore the book and discuss it with you. Converse naturally: answer what the reader actually asks, in whatever depth the conversation calls for.

Below is background material from the book: its glossary, which is always included, and passages retrieved because they may relate to the reader's latest message. Treat this material as your familiarity with the book, not as a script. Draw on it as much or as little as is natural: build an answer around it, make a passing connection, or leave it aside when it isn't relevant. Quote the book when its exact wording helps.

When you speak for the book, stay faithful to what it says and don't attribute views to it that the material doesn't support. If a question goes beyond what the material covers, you can still answer from general knowledge, but make clear what comes from the book and what doesn't.

The passages are selected automatically, so they may be only loosely related or not related at all. Don't mention the retrieval process or refer to "excerpts" or "passages provided"; speak as someone who knows the book.`;

const GLOSSARY = TERMS.map((t) => `${t.term}: ${t.definition}`).join("\n\n");

type HistoryMessage = { role: "user" | "assistant"; content: string };

// Searches the book for passages related to the latest message. The previous
// user message is included so follow-ups ("what did he mean by that?") still
// find the right passages. Returns "" if nothing could be retrieved.
async function retrievePassages(message: string, history: HistoryMessage[]): Promise<string> {
  const index = getVectorIndex();
  if (!index) {
    console.error("Book search skipped: UPSTASH_VECTOR_REST_URL / UPSTASH_VECTOR_REST_TOKEN not set");
    return "";
  }

  const previous = [...history].reverse().find((m) => m.role === "user")?.content;
  const query = previous ? `${previous}\n${message}` : message;

  try {
    const results = await index.query({
      data: query,
      topK: 5,
      includeData: true,
      includeMetadata: true,
    });

    return results
      .map((r) => {
        const meta = r.metadata as
          | { chapter?: string; heading?: string; subheading?: string }
          | undefined;
        const location = [meta?.chapter, meta?.heading, meta?.subheading]
          .filter(Boolean)
          .join(" > ");
        return `${location ? `(${location})\n` : ""}${r.data}`;
      })
      .join("\n\n---\n\n");
  } catch (error) {
    console.error("Book search failed:", error);
    return "";
  }
}

export async function POST(req: NextRequest) {
  const { message, model, history = [] } = await req.json();

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const apiToken = process.env.HUGGINGFACE_API_TOKEN;
  if (!apiToken) {
    return NextResponse.json(
      { error: "Hugging Face API token is not configured" },
      { status: 500 }
    );
  }

  if (!model) {
    return NextResponse.json({ error: "No model selected" }, { status: 400 });
  }

  // Only role and content go to the model; stored messages carry extra fields.
  const priorMessages: HistoryMessage[] = (history as HistoryMessage[]).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const passages = await retrievePassages(message, priorMessages);
  const systemContent = [
    SYSTEM_PROMPT,
    `--- Glossary ---\n${GLOSSARY}\n--- End Glossary ---`,
    passages && `--- Passages from the book ---\n${passages}\n--- End Passages ---`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const messages = [
    { role: "system", content: systemContent },
    ...priorMessages,
    { role: "user", content: message },
  ];

  try {
    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 2048,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Hugging Face API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const assistantMessage =
      data.choices?.[0]?.message?.content?.trim() || "No response generated.";
    const respondedModel = data.model || "unknown";

    if (respondedModel !== model && !respondedModel.includes(model)) {
      return NextResponse.json({
        response: assistantMessage,
        respondedModel,
        warning: `Requested ${model} but got response from ${respondedModel}`,
      });
    }

    return NextResponse.json({ response: assistantMessage, respondedModel });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to reach Hugging Face API: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
