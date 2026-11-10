"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import QuestionCard, { AuthorButton } from "../question-card";
import { useAdmin } from "../../lib/admin-context";
import type { Question } from "../../lib/redis";

export default function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { admin } = useAdmin();
  const [question, setQuestion] = useState<Question | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/questions/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        setNotFound(false);
        setQuestion(await res.json());
      })
      .catch(() => setNotFound(true));
  }, [id, admin]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <main id="main-content" tabIndex={-1} className="h-full overflow-y-auto bg-page text-text-primary outline-none">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <Link href="/questions" className="text-sm text-text-secondary hover:text-text-heading transition-colors">
            ← All questions
          </Link>
          <div className="flex items-center gap-4">
            {question && (
              <button
                onClick={copyLink}
                className="text-sm text-text-secondary hover:text-text-heading transition-colors cursor-pointer"
              >
                {copied ? "Link copied" : "Copy link"}
              </button>
            )}
            <AuthorButton />
          </div>
        </div>

        {notFound && <p className="text-text-muted">This question doesn&apos;t exist or has been removed.</p>}
        {!notFound && !question && <p className="text-text-muted">Loading…</p>}
        {question && <QuestionCard question={question} admin={admin} onChange={setQuestion} />}
      </div>
    </main>
  );
}
