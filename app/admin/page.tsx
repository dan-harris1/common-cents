"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "../lib/admin-context";
import { INPUT_CLASS, BUTTON_CLASS } from "../questions/question-card";

// Author sign-in. A single password (ADMIN_PASSWORD) unlocks answering,
// editing and hiding reader questions. After signing in it returns to the
// page in ?next (where login was clicked), or to Questions.
export default function Admin() {
  const router = useRouter();
  const { admin, signIn } = useAdmin();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!admin) return;
    const next = new URLSearchParams(window.location.search).get("next") || "";
    // Only same-site paths, so the link can't bounce the author elsewhere.
    router.replace(next.startsWith("/") && !next.startsWith("//") ? next : "/questions");
  }, [admin, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const err = await signIn(password);
    setBusy(false);
    setPassword("");
    setError(err);
  }

  return (
    <main id="main-content" tabIndex={-1} className="h-full overflow-y-auto bg-page text-text-primary outline-none">
      <div className="max-w-sm mx-auto px-6 py-16">
        <h1 className="text-2xl font-semibold text-text-heading mb-6">Author login</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="admin-password" className="block text-sm text-text-secondary">Password</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            autoFocus
            className={`${INPUT_CLASS} h-10`}
          />
          <button type="submit" disabled={busy || !password} className={`${BUTTON_CLASS} w-full`}>
            Sign in
          </button>
          {error && <p className="text-sm text-error-text">{error}</p>}
        </form>
      </div>
    </main>
  );
}
