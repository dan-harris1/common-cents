"use client";

import { useEffect, useCallback } from "react";
import { TERMS } from "../glossary-terms";
import { termSlug, splitGlossaryTerms } from "../lib/glossary";
import "./glossary.css";

function scrollToTerm(slug: string, smooth: boolean) {
  const el = document.getElementById(slug);
  if (!el) return;
  el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  // Restart the highlight animation even if the same term is clicked twice.
  el.classList.remove("glossary-entry-highlight");
  void el.offsetWidth;
  el.classList.add("glossary-entry-highlight");
}

function Definition({ text, selfSlug }: { text: string; selfSlug: string }) {
  return (
    <>
      {splitGlossaryTerms(text).map((seg, i) =>
        seg.slug && seg.slug !== selfSlug ? (
          <a key={i} className="glossary-link" href={`#${seg.slug}`} data-term={seg.slug}>
            {seg.text}
          </a>
        ) : (
          seg.text
        )
      )}
    </>
  );
}

export default function Glossary() {
  useEffect(() => {
    const slug = decodeURIComponent(window.location.hash.slice(1));
    if (slug) scrollToTerm(slug, false);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest(".glossary-link");
    if (!target) return;
    e.preventDefault();
    const slug = target.getAttribute("data-term")!;
    history.replaceState(null, "", `#${slug}`);
    scrollToTerm(slug, true);
  }, []);

  return (
    <div className="flex flex-col h-full bg-page text-text-primary">
      <div className="flex-1 overflow-y-auto">
        <div className="glossary max-w-3xl mx-auto px-6 py-10" onClick={handleClick}>
          <h1>Glossary</h1>
          <dl>
            {TERMS.map((entry) => {
              const slug = termSlug(entry.term);
              return (
                <div key={entry.term} id={slug} className="glossary-entry">
                  <dt>{entry.term}</dt>
                  <dd className="whitespace-pre-line">
                    <Definition text={entry.definition} selfSlug={slug} />
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </div>
  );
}
