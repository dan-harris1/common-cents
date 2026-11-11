"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { MODELS } from "../models";
import { scrollToSection, setCurrentSection } from "../lib/chapter";
import InputToolbar from "../input-toolbar";
import "./lectures.css";

interface Lecture {
  id: string;
  title: string;
  paragraphs: string[];
}

export default function LecturesView({ lectures }: { lectures: Lecture[] }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [model, setModel] = useState(MODELS[0].id);
  const scrollRef = useRef<HTMLElement>(null);

  // Tells the sidebar which part the reader is in: the last heading at or
  // above the top of the viewport.
  const trackSection = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const top = container.getBoundingClientRect().top;
    let current = lectures[0]?.id ?? "";
    for (const heading of container.querySelectorAll<HTMLElement>("h2[id]")) {
      if (heading.getBoundingClientRect().top - top <= 80) current = heading.id;
      else break;
    }
    setCurrentSection(current);
  }, [lectures]);

  // Jump to the part in the URL hash, if any.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) scrollToSection(id, false);
    trackSection();
  }, [trackSection]);

  return (
    <div className="flex flex-col h-full bg-page text-text-primary">
      <main
        ref={scrollRef}
        id="main-content"
        tabIndex={-1}
        onScroll={trackSection}
        className="flex-1 overflow-y-auto outline-none"
      >
        <article className="lecture-content max-w-3xl mx-auto px-6 py-10">
          <h1>V50 Lectures</h1>
          {lectures.map((lecture) => (
            <section key={lecture.id}>
              <h2 id={lecture.id}>{lecture.title}</h2>
              {lecture.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </section>
          ))}
        </article>
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
