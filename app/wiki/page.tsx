"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MODELS } from "../models";
import { termBySlug, splitGlossaryTerms } from "../lib/glossary";
import {
  loadChapter,
  tagSections,
  scrollToSection,
  setCurrentSection,
  loadPlace,
  savePlace,
  clearPlace,
  SECTION_SELECTOR,
} from "../lib/chapter";
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

  const scrollRef = useRef<HTMLElement>(null);
  const skipNextSave = useRef(false);
  // Latest place the reader scrolled to; saved without touching the DOM so it
  // still works while the page is unmounting.
  const lastPlace = useRef<{ section: string; offset: number } | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The section the reader is in: the last heading at or above the top of the
  // viewport, plus how far past that heading they've scrolled.
  const findPlace = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return null;
    const containerTop = container.getBoundingClientRect().top;
    const headings = container.querySelectorAll<HTMLElement>(SECTION_SELECTOR);
    let current: HTMLElement | null = headings[0] ?? null;
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top - containerTop <= 80) current = heading;
      else break;
    }
    if (!current) return null;
    const headingTop = current.getBoundingClientRect().top - containerTop + container.scrollTop;
    return { section: current.id, offset: Math.round(container.scrollTop - headingTop) };
  }, []);

  const saveNow = useCallback(() => {
    clearTimeout(saveTimer.current);
    const place = lastPlace.current;
    if (place) savePlace(place.section, place.offset);
    lastPlace.current = null;
  }, []);

  // Once the chapter has rendered (before it's painted): a section in the URL
  // wins, otherwise reopen where the reader left off.
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!html || !container) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) {
      scrollToSection(id, false);
    } else {
      const place = loadPlace();
      const heading = place && document.getElementById(place.section);
      if (place && heading) {
        const headingTop =
          heading.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
        container.scrollTop = headingTop + place.offset;
        skipNextSave.current = true;
      } else if (place) {
        clearPlace();
      }
    }
    setCurrentSection(findPlace()?.section ?? "");
  }, [html, findPlace]);

  const handleScroll = useCallback(() => {
    const place = findPlace();
    if (place) setCurrentSection(place.section);
    // The scroll caused by restoring the saved place isn't the reader moving.
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    lastPlace.current = place;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveNow, 500);
  }, [findPlace, saveNow]);

  // Also save when the tab is hidden or closed, and when leaving the page.
  useEffect(() => {
    if (!html) return;
    function onHide() {
      if (document.visibilityState === "hidden") saveNow();
    }
    window.addEventListener("pagehide", saveNow);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", saveNow);
      document.removeEventListener("visibilitychange", onHide);
      saveNow();
    };
  }, [html, saveNow]);

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
      <main
        ref={scrollRef}
        id="main-content"
        tabIndex={-1}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto outline-none"
      >
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
      </main>
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
