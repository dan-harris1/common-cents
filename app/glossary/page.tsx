"use client";

import { TERMS } from "../glossary-terms";
import "./glossary.css";

export default function Glossary() {
  return (
    <div className="flex flex-col h-full bg-page text-text-primary">
      <div className="flex-1 overflow-y-auto">
        <div className="glossary max-w-3xl mx-auto px-6 py-10">
          <h1>Glossary</h1>
          <dl>
            {TERMS.map((entry) => (
              <div key={entry.term} id={entry.term.toLowerCase().replace(/\s+/g, "-")} className="glossary-entry">
                <dt>{entry.term}</dt>
                <dd className="whitespace-pre-line">{entry.definition}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
