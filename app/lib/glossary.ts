import { TERMS } from "../glossary-terms";

export function termSlug(term: string): string {
  return term.toLowerCase().replace(/\s+/g, "-");
}

export const termBySlug = new Map(TERMS.map((t) => [termSlug(t.term), t]));

// Longest terms first so e.g. "Token-of-credit" wins over "Token".
const sortedTerms = [...TERMS].sort((a, b) => b.term.length - a.term.length);

export const glossaryPattern = new RegExp(
  `\\b(${sortedTerms.map((t) => t.term.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")).join("|")})\\b`,
  "gi"
);

export type GlossarySegment = { text: string; slug?: string };

// Splits plain text into segments, tagging the ones that match a glossary term.
export function splitGlossaryTerms(text: string): GlossarySegment[] {
  const segments: GlossarySegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  glossaryPattern.lastIndex = 0;
  while ((match = glossaryPattern.exec(text)) !== null) {
    if (match.index > lastIndex) segments.push({ text: text.slice(lastIndex, match.index) });
    segments.push({ text: match[1], slug: termSlug(match[1]) });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) segments.push({ text: text.slice(lastIndex) });

  return segments;
}
