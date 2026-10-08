import { NextRequest, NextResponse } from "next/server";
import { getVectorIndex } from "../../lib/vector";

export async function POST(req: NextRequest) {
  const { message, model, history, mode } = await req.json();

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

  let systemMessage: { role: string; content: string } | null = null;

  if (mode === "book") {
    const index = getVectorIndex();
    if (!index) {
      return NextResponse.json(
        { error: "Book mode requires Vector index. Set UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN in .env.local, then POST to /api/index to index the book." },
        { status: 500 }
      );
    }

    try {
      const results = await index.query({
        data: message,
        topK: 5,
        includeData: true,
        includeMetadata: true,
      });

      if (results.length > 0) {
        const excerpts = results
          .map((r, i) => {
            const meta = r.metadata as
              | { chapter?: string; heading?: string; subheading?: string }
              | undefined;
            const location = [meta?.chapter, meta?.heading, meta?.subheading]
              .filter(Boolean)
              .join(" > ");
            return `[${i + 1}]${location ? ` (${location})` : ""}\n${r.data}`;
          })
          .join("\n\n");

        systemMessage = {
          role: "system",
          content: `You are a knowledgeable assistant discussing the book "Common Cents." Answer the user's question using the following excerpts from the book. Quote or reference specific passages when relevant. If the excerpts don't contain enough information to fully answer, acknowledge what the book says and note what isn't covered.\n\n--- Book Excerpts ---\n${excerpts}\n--- End Excerpts ---`,
        };
      } else {
        systemMessage = {
          role: "system",
          content:
            'You are a knowledgeable assistant discussing the book "Common Cents." The user asked a question in Book mode, but no relevant excerpts were found in the index. Let them know you couldn\'t find relevant book content for their question, and suggest they try rephrasing or switching to Open mode.',
        };
      }
    } catch {
      systemMessage = {
        role: "system",
        content:
          'You are a knowledgeable assistant discussing the book "Common Cents." There was an issue retrieving book content. Answer as best you can, and let the user know the book search encountered an error.',
      };
    }
  }

  const messages = [
    ...(systemMessage ? [systemMessage] : []),
    ...(history || []),
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
