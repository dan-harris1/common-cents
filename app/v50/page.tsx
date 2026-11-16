"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MODELS } from "../models";
import { scrollToSection, setCurrentSection } from "../lib/chapter";
import { loadLectures, tagLectureSections, LECTURE_SECTION_SELECTOR } from "../lib/lectures";
import InputToolbar from "../input-toolbar";
import "../wiki/wiki.css";
import "./v50.css";

// Adds section ids (for the sidebar's table of contents) to the lectures HTML.
function prepareLectures(html: string): string {
  const container = document.createElement("div");
  container.innerHTML = html;
  tagLectureSections(container);
  return container.innerHTML;
}

export default function V50Lectures() {
  const router = useRouter();
  const [html, setHtml] = useState("");
  const [input, setInput] = useState("");
  const [model, setModel] = useState(MODELS[0].id);
  const scrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    loadLectures().then((body) => setHtml(prepareLectures(body)));
  }, []);

  // Tells the sidebar which part the reader is in: the last part title at or
  // above the top of the viewport.
  const trackSection = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const top = container.getBoundingClientRect().top;
    const headings = container.querySelectorAll<HTMLElement>(LECTURE_SECTION_SELECTOR);
    let current = headings[0]?.id ?? "";
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top - top <= 80) current = heading.id;
      else break;
    }
    setCurrentSection(current);
  }, []);

  // Jump to the part in the URL hash once the lectures have rendered.
  useEffect(() => {
    if (!html) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) scrollToSection(id, false);
    trackSection();
  }, [html, trackSection]);

  return (
    <div className="flex flex-col h-full bg-page text-text-primary">
      <main
        ref={scrollRef}
        id="main-content"
        tabIndex={-1}
        onScroll={trackSection}
        className="flex-1 overflow-y-auto outline-none"
      >
        <article
          className="wiki-content v50-content max-w-3xl mx-auto px-6 py-10"
          dangerouslySetInnerHTML={{ __html: html }}
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
