"use client";

import { useState, useEffect } from "react";
import "../wiki/wiki.css";

export default function WikiClean() {
  const [html, setHtml] = useState("");

  useEffect(() => {
    fetch("/chapter1-clean.html")
      .then((res) => res.text())
      .then((text) => {
        const match = text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        setHtml(match ? match[1] : text);
      });
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-page">
      <article
        className="wiki-content max-w-3xl mx-auto px-6 py-10"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
