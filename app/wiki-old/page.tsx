"use client";

import { useState, useEffect } from "react";
import "./wiki.css";

export default function Wiki() {
  const [html, setHtml] = useState("");

  useEffect(() => {
    fetch("/chapter1.html")
      .then((res) => res.text())
      .then((text) => {
        const match = text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        setHtml(match ? match[1] : text);
      });
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-zinc-900">
      <article
        className="wiki-old-content max-w-3xl mx-auto px-6 py-10"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
