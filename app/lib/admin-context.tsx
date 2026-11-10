"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface AdminContextValue {
  admin: boolean;
  signIn: (password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

// Whether the author is signed in. The cookie itself is httpOnly, so the
// client asks the server once on load.
export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth")
      .then((res) => res.json())
      .then((data) => setAdmin(!!data.admin))
      .catch(() => {});
  }, []);

  // Resolves to an error message, or null on success.
  const signIn = useCallback(async (password: string) => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) return data.error || "Sign in failed";
      setAdmin(true);
      return null;
    } catch {
      return "Failed to connect to the server";
    }
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth", { method: "DELETE" }).catch(() => {});
    setAdmin(false);
  }, []);

  return (
    <AdminContext.Provider value={{ admin, signIn, signOut }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
