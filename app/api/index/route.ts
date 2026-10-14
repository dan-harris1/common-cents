import { NextResponse } from "next/server";
import { getVectorIndex } from "../../lib/vector";
import { chunkBook } from "../../lib/chunk";

export async function GET() {
  const index = getVectorIndex();
  if (!index) {
    return NextResponse.json({
      configured: false,
      message:
        "Set UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN in .env.local",
    });
  }

  try {
    const info = await index.info();
    return NextResponse.json({
      configured: true,
      vectorCount: info.vectorCount,
      dimension: info.dimension,
    });
  } catch (error) {
    return NextResponse.json({
      configured: true,
      error: (error as Error).message,
    });
  }
}

export async function POST() {
  const index = getVectorIndex();
  if (!index) {
    return NextResponse.json(
      {
        error:
          "Vector index not configured. Set UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN in .env.local",
      },
      { status: 500 }
    );
  }

  const chunks = chunkBook();
  if (chunks.length === 0) {
    return NextResponse.json(
      { error: "No chunks extracted from book content" },
      { status: 500 }
    );
  }

  await index.reset();

  const batchSize = 10;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    await index.upsert(
      batch.map((c) => ({
        id: c.id,
        data: c.text,
        metadata: c.metadata,
      }))
    );
  }

  return NextResponse.json({ indexed: chunks.length });
}
