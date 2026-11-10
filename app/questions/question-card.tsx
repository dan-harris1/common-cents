"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAdmin } from "../lib/admin-context";
import MarkdownMessage from "../markdown-message";
import type { Question } from "../lib/redis";

export const INPUT_CLASS =
  "w-full bg-input border border-border-input rounded-xl px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-muted transition-colors";
export const BUTTON_CLASS =
  "bg-btn hover:bg-btn-hover disabled:opacity-40 disabled:hover:bg-btn text-btn-text rounded-xl px-4 h-10 text-sm font-medium transition-colors cursor-pointer disabled:cursor-default";
const SMALL_BUTTON_CLASS =
  "px-3 h-8 rounded-lg text-sm text-text-secondary hover:text-text-heading hover:bg-surface-hover border border-border transition-colors cursor-pointer disabled:opacity-40";

// Author login/sign-out for the Questions pages. Login returns to the page it
// was clicked on, so the author can answer a linked question directly.
export function AuthorButton() {
  const pathname = usePathname();
  const { admin, signOut } = useAdmin();
  const className =
    "shrink-0 px-3 h-8 flex items-center rounded-lg text-sm text-text-secondary hover:text-text-heading hover:bg-surface-hover border border-border transition-colors cursor-pointer";
  return admin ? (
    <button onClick={signOut} className={className}>
      Author sign out
    </button>
  ) : (
    <Link href={`/admin?next=${encodeURIComponent(pathname)}`} className={className}>
      Author login
    </Link>
  );
}

export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function Chip({ children, tone }: { children: React.ReactNode; tone: "muted" | "answered" | "hidden" }) {
  const styles = {
    muted: "bg-surface text-text-secondary",
    answered: "bg-green-600/15 text-green-700 dark:text-green-400",
    hidden: "bg-error-bg text-error-text",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[tone]}`}>{children}</span>;
}

// One reader question with its author answer. When `admin` is set it also
// shows the controls to answer, edit or delete the answer, and hide it.
export default function QuestionCard({
  question,
  admin,
  linked = false,
  onChange,
}: {
  question: Question;
  admin: boolean;
  linked?: boolean;
  onChange: (updated: Question) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update(body: { answer?: string | null; hidden?: boolean }) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/questions/${question.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return false;
      }
      onChange(data);
      return true;
    } catch {
      setError("Failed to connect to the server");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const text = <p className="text-text-heading whitespace-pre-wrap break-words leading-relaxed">{question.text}</p>;

  return (
    <article className={`rounded-2xl border border-border p-5 ${question.hidden ? "opacity-60" : ""}`}>
      {linked ? (
        <Link href={`/questions/${question.id}`} className="block hover:underline decoration-text-muted underline-offset-4">
          {text}
        </Link>
      ) : (
        text
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-muted">
        <span>{question.name}</span>
        <span aria-hidden>·</span>
        <span>{formatDate(question.createdAt)}</span>
        {question.status === "answered" ? (
          <Chip tone="answered">Answered</Chip>
        ) : (
          <Chip tone="muted">Awaiting answer</Chip>
        )}
        {question.hidden && <Chip tone="hidden">Hidden</Chip>}
      </div>

      {question.answer && !editing && (
        <div className="mt-4 rounded-xl bg-bubble-ai px-4 py-3 border-l-4 border-bubble-user">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
            Author&apos;s answer
            {question.answeredAt && <span className="normal-case font-normal tracking-normal"> · {formatDate(question.answeredAt)}</span>}
          </p>
          <div className="text-bubble-ai-text">
            <MarkdownMessage content={question.answer} />
          </div>
        </div>
      )}

      {admin && editing && (
        <form
          className="mt-4 space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await update({ answer: draft })) setEditing(false);
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            autoFocus
            placeholder="Write your answer…"
            className={`${INPUT_CLASS} resize-y leading-relaxed`}
          />
          <p className="text-xs text-text-muted">
            Leave a blank line between paragraphs. **bold**, *italic* and [link text](https://…) work.
          </p>
          <div className="flex gap-2">
            <button type="submit" disabled={busy || !draft.trim()} className={BUTTON_CLASS}>
              {question.answer ? "Save answer" : "Post answer"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className={SMALL_BUTTON_CLASS + " h-10"}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {admin && !editing && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setDraft(question.answer || "");
              setEditing(true);
            }}
            disabled={busy}
            className={SMALL_BUTTON_CLASS}
          >
            {question.answer ? "Edit answer" : "Answer"}
          </button>
          {question.answer && (
            <button
              onClick={() => {
                if (confirm("Delete this answer?")) update({ answer: null });
              }}
              disabled={busy}
              className={SMALL_BUTTON_CLASS}
            >
              Delete answer
            </button>
          )}
          <button onClick={() => update({ hidden: !question.hidden })} disabled={busy} className={SMALL_BUTTON_CLASS}>
            {question.hidden ? "Unhide question" : "Hide question"}
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-error-text">{error}</p>}
    </article>
  );
}
