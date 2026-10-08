import { readFileSync } from "fs";
import { join } from "path";

export interface BookChunk {
  id: string;
  text: string;
  metadata: {
    chapter: string;
    heading: string;
    subheading: string;
    type: string;
  };
}

function decode(html: string): string {
  return html
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&#9;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function chunkBook(): BookChunk[] {
  const html = readFileSync(
    join(process.cwd(), "public/chapter1.html"),
    "utf-8"
  );
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) return [];

  const pRegex = /<p\s+class="([^"]*)"[^>]*>([\s\S]*?)<\/p>/g;
  const paragraphs: { cls: string; text: string }[] = [];
  let m;
  while ((m = pRegex.exec(bodyMatch[1])) !== null) {
    const cls = m[1].split(" ")[0];
    const text = decode(m[2]);
    if (text) paragraphs.push({ cls, text });
  }

  const chunks: BookChunk[] = [];
  let chapter = "";
  let heading = "";
  let subheading = "";
  let buffer: string[] = [];
  let type = "body";
  let idx = 0;
  let started = false;

  function flush() {
    const joined = buffer.join("\n\n").trim();
    if (joined.length > 50) {
      const parts = joined.length > 2000 ? splitBuffer(buffer) : [joined];
      for (const text of parts) {
        chunks.push({
          id: `ch1-${idx++}`,
          text,
          metadata: { chapter, heading, subheading, type },
        });
      }
    }
    buffer = [];
  }

  for (const p of paragraphs) {
    if (!started) {
      if (p.cls === "eBook_Quote" || p.cls === "eBook_Chapter-Name") {
        started = true;
      } else {
        continue;
      }
    }

    switch (p.cls) {
      case "eBook_Chapter-Name":
        flush();
        chapter = p.text;
        heading = "";
        subheading = "";
        type = "chapter";
        buffer.push(p.text);
        break;
      case "eBook_Chapter-Synopsis":
        buffer.push(p.text);
        break;
      case "eBook_Heading":
        flush();
        heading = p.text;
        subheading = "";
        type = "section";
        buffer.push(p.text);
        break;
      case "eBook_SubHeading":
        flush();
        subheading = p.text;
        type = "subsection";
        buffer.push(p.text);
        break;
      case "Sidebar_Sidebar-Heading":
        flush();
        type = "definition";
        buffer.push(`Definition — ${p.text}`);
        break;
      case "Sidebar_Sidebar-Heading-Topic":
        buffer.push(`Topic: ${p.text}`);
        break;
      case "eBook_Body":
      case "Sidebar_Sidebar-Body":
      case "Sidebar_Syllogism":
      case "eBook_Call-Out":
        buffer.push(p.text);
        break;
      case "eBook_Quote":
        buffer.push(`"${p.text}"`);
        break;
      case "eBook_Quote-Author":
        buffer.push(p.text);
        break;
    }
  }

  flush();
  return chunks;
}

function splitBuffer(texts: string[]): string[] {
  const parts: string[] = [];
  let current: string[] = [];
  let len = 0;
  for (const t of texts) {
    if (len + t.length > 1500 && current.length > 0) {
      parts.push(current.join("\n\n"));
      current = [];
      len = 0;
    }
    current.push(t);
    len += t.length;
  }
  if (current.length > 0) parts.push(current.join("\n\n"));
  return parts;
}
