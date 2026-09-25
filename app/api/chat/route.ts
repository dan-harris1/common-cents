import { NextRequest, NextResponse } from "next/server";

const DEFAULT_MODEL = "moonshotai/Kimi-K3";

export async function POST(req: NextRequest) {
  const { message, model, history } = await req.json();

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

  const modelId = model;

  const messages = [
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
          model: modelId,
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

    if (respondedModel !== modelId && !respondedModel.includes(modelId)) {
      return NextResponse.json({
        response: assistantMessage,
        respondedModel,
        warning: `Requested ${modelId} but got response from ${respondedModel}`,
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
