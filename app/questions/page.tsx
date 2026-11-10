"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import QuestionCard, { AuthorButton, INPUT_CLASS, BUTTON_CLASS } from "./question-card";
import { useAdmin } from "../lib/admin-context";
import type { Question } from "../lib/redis";

const MAX_LENGTH = 500;

export default function Questions() {
  const router = useRouter();
  const { admin } = useAdmin();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch("/api/questions");
      if (res.ok) setQuestions(await res.json());
    } catch {}
  }, []);

  // Refetch when the author signs in or out so hidden questions appear/vanish.
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions, admin]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || posting) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, name, website }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      router.push(`/questions/${data.id}`);
    } catch {
      setError("Failed to connect to the server");
    } finally {
      setPosting(false);
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="h-full overflow-y-auto bg-page text-text-primary outline-none">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h1 className="text-[1.75rem] font-bold text-text-heading">Questions</h1>
          <AuthorButton />
        </div>
        <p className="text-text-secondary mb-6">
          {admin
            ? "You're signed in as the author. Answer, edit, or hide readers' questions below."
            : "Ask the author about the book. Questions and answers are public."}
        </p>

        {/* Only readers ask; the signed-in author just sees the list to answer. */}
        {!admin && (
        <form onSubmit={handleSubmit} className="space-y-3 mb-12">
          <div>
            <label htmlFor="question-text" className="sr-only">Your question</label>
            <textarea
              id="question-text"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
              required
              rows={4}
              placeholder="Your question"
              className={`${INPUT_CLASS} resize-y leading-relaxed`}
            />
            <p className="mt-1 text-right text-xs text-text-muted">
              {text.length}/{MAX_LENGTH}
            </p>
          </div>
          {/* Honeypot: hidden from people, so only bots fill it in. */}
          <div aria-hidden className="absolute -left-[9999px] w-px h-px overflow-hidden">
            <label>
              Website
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <label htmlFor="question-name" className="sr-only">Your name (optional)</label>
            <input
              id="question-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              placeholder="Your name (optional)"
              className={`${INPUT_CLASS} sm:flex-1 h-10`}
            />
            <button type="submit" disabled={posting || !text.trim()} className={BUTTON_CLASS}>
              {posting ? "Posting…" : "Post question"}
            </button>
          </div>
          {error && <p className="text-sm text-error-text">{error}</p>}
        </form>
        )}

        <div className="space-y-4">
          {questions === null && <p className="text-text-muted">Loading questions…</p>}
          {questions?.length === 0 && <p className="text-text-muted">No questions yet. Be the first to ask.</p>}
          {questions?.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              admin={admin}
              linked
              onChange={(updated) =>
                setQuestions((prev) => prev && prev.map((p) => (p.id === updated.id ? updated : p)))
              }
            />
          ))}
        </div>
      </div>
    </main>
  );
}
