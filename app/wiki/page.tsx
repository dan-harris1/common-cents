"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MODELS } from "../models";
import InputToolbar from "../input-toolbar";
import "./wiki.css";

export default function Wiki() {
  const [html, setHtml] = useState("");
  const [input, setInput] = useState("");
  const [model, setModel] = useState(MODELS[0].id);
  const [mode, setMode] = useState<"book" | "open">("open");
  const router = useRouter();

  useEffect(() => {
    fetch("/chapter1.html")
      .then((res) => res.text())
      .then((text) => {
        const match = text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        setHtml(match ? match[1] : text);
      });
  }, []);

  return (
    <div className="flex flex-col h-full bg-page text-text-primary">
      <div className="flex-1 overflow-y-auto">
        <article
          className="wiki-content max-w-3xl mx-auto px-6 py-10"
          dangerouslySetInnerHTML={{ __html: html }}
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
