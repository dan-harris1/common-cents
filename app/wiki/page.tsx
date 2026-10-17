"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MODELS } from "../models";
import { TERMS } from "../glossary-terms";
import InputToolbar from "../input-toolbar";
import "./wiki.css";

const termLookup = new Map(
  TERMS.map((t) => [t.term.toLowerCase(), t])
);

const sortedTerms = [...TERMS].sort((a, b) => b.term.length - a.term.length);

const combinedPattern = new RegExp(
  `\\b(${sortedTerms.map((t) => t.term.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")).join("|")})\\b`,
  "gi"
);

function linkGlossaryTerms(html: string): string {
  const container = document.createElement("div");
  container.innerHTML = html;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  for (const node of textNodes) {
    const parent = node.parentElement;
    if (!parent || parent.tagName === "A") continue;

    const text = node.textContent || "";
    combinedPattern.lastIndex = 0;
    if (!combinedPattern.test(text)) continue;

    combinedPattern.lastIndex = 0;
    const parts: string[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = combinedPattern.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index);
      if (before) parts.push(escapeHtml(before));

      const term = match[1];
      const slug = term.toLowerCase().replace(/\s+/g, "-");
      parts.push(`<a class="glossary-link" href="/glossary#${slug}" data-term="${slug}">${escapeHtml(term)}</a>`);
      lastIndex = match.index + match[0].length;
    }

    const after = text.slice(lastIndex);
    if (after) parts.push(escapeHtml(after));

    if (parts.length > 0) {
      const span = document.createElement("span");
      span.innerHTML = parts.join("");
      parent.replaceChild(span, node);
    }
  }

  return container.innerHTML;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function Wiki() {
  const [html, setHtml] = useState("");
  const [input, setInput] = useState("");
  const [model, setModel] = useState(MODELS[0].id);
  const [mode, setMode] = useState<"book" | "open">("open");
  const [tooltip, setTooltip] = useState<{ text: string; anchor: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/chapter1.html")
      .then((res) => res.text())
      .then((text) => {
        const match = text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        const body = match ? match[1] : text;
        setHtml(linkGlossaryTerms(body));
      });
  }, []);

  const anchorCounter = useRef(0);

  const handleMouseOver = useCallback((e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest(".glossary-link") as HTMLElement | null;
    if (!target) return;
    const slug = target.getAttribute("data-term");
    if (!slug) return;

    const entry = TERMS.find(
      (t) => t.term.toLowerCase().replace(/\s+/g, "-") === slug
    );
    if (!entry) return;

    const definition = entry.definition.split("\n\n")[0];
    const anchorName = `--gl-${++anchorCounter.current}`;
    target.style.anchorName = anchorName;
    setTooltip({ text: definition, anchor: anchorName });
  }, []);

  const handleMouseOut = useCallback((e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest(".glossary-link");
    if (target) setTooltip(null);
  }, []);

  return (
    <div className="flex flex-col h-full bg-page text-text-primary">
      <div className="flex-1 overflow-y-auto">
        {tooltip && (
          <div
            className="glossary-tooltip"
            style={{ positionAnchor: tooltip.anchor } as React.CSSProperties}
          >
            {tooltip.text}
          </div>
        )}
        <article
          className="wiki-content max-w-3xl mx-auto px-6 py-10"
          dangerouslySetInnerHTML={{ __html: html }}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
        />
      </div>
      <InputToolbar
        input={input}
        setInput={setInput}
        model={model}
        setModel={setModel}
        mode={mode}
        setMode={setMode}
        onSubmit={(text) => {
          try {
            sessionStorage.setItem("cc-chat", JSON.stringify({ q: text, model, mode }));
          } catch {}
          router.push("/chat");
        }}
      />
    </div>
  );
}
