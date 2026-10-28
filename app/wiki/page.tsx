"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MODELS } from "../models";
import { termBySlug, splitGlossaryTerms } from "../lib/glossary";
import { loadChapter, tagSections, scrollToSection } from "../lib/chapter";
import InputToolbar from "../input-toolbar";
import "./wiki.css";

// Adds section ids (for the sidebar's table of contents) and glossary links.
function prepareChapter(html: string): string {
  const container = document.createElement("div");
  container.innerHTML = html;
  tagSections(container);

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  for (const node of textNodes) {
    const parent = node.parentElement;
    if (!parent || parent.tagName === "A") continue;

    const segments = splitGlossaryTerms(node.textContent || "");
    if (!segments.some((seg) => seg.slug)) continue;

    const parts = segments.map((seg) =>
      seg.slug
        ? `<a class="glossary-link" href="/glossary#${seg.slug}" data-term="${seg.slug}">${escapeHtml(seg.text)}</a>`
        : escapeHtml(seg.text)
    );

    const span = document.createElement("span");
    span.innerHTML = parts.join("");
    parent.replaceChild(span, node);
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
  const [tooltip, setTooltip] = useState<{ text: string; anchor: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadChapter().then((body) => setHtml(prepareChapter(body)));
  }, []);

  // Jump to the section in the URL hash once the chapter has rendered.
  useEffect(() => {
    if (!html) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) scrollToSection(id, false);
  }, [html]);

  const anchorCounter = useRef(0);

  const handleMouseOver = useCallback((e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest(".glossary-link") as HTMLElement | null;
    if (!target) return;
    const slug = target.getAttribute("data-term");
    if (!slug) return;

    const entry = termBySlug.get(slug);
    if (!entry) return;

    const definition = entry.definition.split("\n\n")[0];
    const anchorName = `--gl-${++anchorCounter.current}`;
    (target.style as unknown as Record<string, string>).anchorName = anchorName;
    setTooltip({ text: definition, anchor: anchorName });
  }, []);

  // Navigate client-side so the glossary page can scroll to the clicked term.
  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest(".glossary-link");
    if (!target || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    setTooltip(null);
    router.push(`/glossary#${target.getAttribute("data-term")}`);
  }, [router]);

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
          onClick={handleClick}
        />
      </div>
      <InputToolbar
        input={input}
        setInput={setInput}
        model={model}
        setModel={setModel}
        onSubmit={(text) => {
          try {
            sessionStorage.setItem("cc-chat", JSON.stringify({ q: text, model }));
          } catch {}
          router.push("/chat");
        }}
      />
    </div>
  );
}
