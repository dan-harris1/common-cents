"use client";

import { useEffect, useRef, useState } from "react";
import { MODELS } from "./models";

// Composer is 48px tall (38px content + padding + border) to line up with the
// sidebar's bottom row so their top borders form one continuous line.
const INPUT_BASE_HEIGHT = 38;

export default function InputToolbar({
  input,
  setInput,
  model,
  setModel,
  onSubmit,
  loading = false,
  modelLocked = false,
}: {
  input: string;
  setInput: (val: string) => void;
  model: string;
  setModel: (val: string) => void;
  onSubmit: (text: string) => void;
  loading?: boolean;
  modelLocked?: boolean;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const modelName = MODELS.find((m) => m.id === model)?.name ?? model;

  useEffect(() => {
    if (!showSettings) return;
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showSettings]);

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
      <div className="max-w-3xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-1 bg-input border border-border-input rounded-2xl p-1 focus-within:border-text-muted transition-colors"
        >
          <div ref={settingsRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              aria-label="Chat settings"
              title={modelName}
              className={`w-[38px] h-[38px] flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
                showSettings
                  ? "bg-surface text-text-heading"
                  : "text-text-muted hover:text-text-heading hover:bg-surface-hover"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
                <circle cx="9" cy="6" r="2" fill="var(--color-input)" />
                <circle cx="15" cy="12" r="2" fill="var(--color-input)" />
                <circle cx="7" cy="18" r="2" fill="var(--color-input)" />
              </svg>
            </button>

            {showSettings && (
              <div className="absolute bottom-full left-0 mb-3 w-60 bg-menu border border-border rounded-lg shadow-xl py-1 z-50">
                <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Model
                </p>
                {modelLocked && (
                  <p className="px-3 pb-1 text-xs text-text-muted">
                    The model can&apos;t be changed once a chat has started.
                  </p>
                )}
                {MODELS.map((m) => {
                  const selected = m.id === model;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={modelLocked}
                      onClick={() => {
                        setModel(m.id);
                        setShowSettings(false);
                        inputRef.current?.focus();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                        selected ? "text-text-heading font-medium" : "text-text-secondary"
                      } ${modelLocked ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-surface-hover hover:text-text-heading"}`}
                    >
                      {m.name}
                      {selected && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
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
            className="flex-1 min-w-0 bg-transparent px-2 py-[7px] leading-6 text-text-primary resize-none focus:outline-none disabled:opacity-50 placeholder:text-text-muted"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send"
            className="shrink-0 w-[38px] h-[38px] flex items-center justify-center rounded-xl bg-btn hover:bg-btn-hover disabled:opacity-40 disabled:hover:bg-btn text-btn-text transition-colors cursor-pointer disabled:cursor-default"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </form>
      </div>
    </footer>
  );
}
