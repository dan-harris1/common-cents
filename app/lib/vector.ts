import { Index } from "@upstash/vector";

let _index: Index | null = null;

export function getVectorIndex(): Index | null {
  if (_index) return _index;
  const url = process.env.UPSTASH_VECTOR_REST_URL;
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN;
  if (!url || !token) return null;
  _index = new Index({ url, token });
  return _index;
}
