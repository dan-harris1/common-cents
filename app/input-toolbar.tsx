"use client";

import { useRef } from "react";
import { MODELS } from "./models";

const INPUT_BASE_HEIGHT = 48;

export default function InputToolbar({
  input,
  setInput,
  model,
  setModel,
  mode,
  setMode,
  onSubmit,
  loading = false,
  modelLocked = false,
}: {
  input: string;
  setInput: (val: string) => void;
  model: string;
  setModel: (val: string) => void;
  mode: "book" | "open";
  setMode: (val: "book" | "open") => void;
  onSubmit: (text: string) => void;
  loading?: boolean;
  modelLocked?: boolean;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isBook = mode === "book";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = `${INPUT_BASE_HEIGHT}px`;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <footer className="border-t border-border px-4 py-4">
      <div className="grid items-end">
        <label className="col-start-1 row-start-1 justify-self-start flex items-center gap-2 h-12 cursor-pointer select-none z-10">
          <input
            type="checkbox"
            checked={isBook}
            onChange={() => setMode(isBook ? "open" : "book")}
            disabled={loading}
            className="sr-only peer"
          />
          <span className={`w-9 h-5 rounded-full transition-colors ${isBook ? "bg-blue-600" : "bg-surface"} relative inline-block peer-disabled:opacity-50`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${isBook ? "translate-x-4" : ""}`} />
          </span>
          <span className={`text-sm font-medium ${isBook ? "text-text-primary" : "text-text-muted"}`}>
            RAG
          </span>
        </label>
        <form
          onSubmit={handleSubmit}
          className="col-start-1 row-start-1 justify-self-center max-w-3xl w-full flex gap-3 items-end"
        >
          <div className="relative">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={modelLocked}
              className="appearance-none bg-input border border-border-input rounded-xl pl-3 pr-9 h-12 text-sm text-text-primary focus:outline-none focus:border-text-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              const el = e.target;
              el.style.height = INPUT_BASE_HEIGHT + "px";
              el.style.height = Math.min(el.scrollHeight, 240) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            disabled={loading}
            style={{ height: INPUT_BASE_HEIGHT }}
            className="flex-1 bg-input border border-border-input rounded-xl px-4 py-3 text-text-primary resize-none focus:outline-none focus:border-text-muted disabled:opacity-50 placeholder:text-text-muted"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-btn hover:bg-btn-hover disabled:opacity-40 disabled:hover:bg-btn text-btn-text rounded-xl px-5 h-12 font-medium transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </footer>
  );
}
