"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface UserProfile {
  name: string;
  color: string;
}

interface UserContextValue {
  currentUser: string | null;
  users: UserProfile[];
  signIn: (name: string) => void;
  signOut: () => void;
  updateColor: (name: string, color: string) => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cc-user");
      if (saved) setCurrentUser(saved);
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then(setUsers)
      .catch(() => {});
  }, []);

  const signIn = useCallback((name: string) => {
    setCurrentUser(name);
    try { localStorage.setItem("cc-user", name); } catch {}
  }, []);

  const signOut = useCallback(() => {
    setCurrentUser(null);
    try { localStorage.removeItem("cc-user"); } catch {}
  }, []);

  const updateColor = useCallback(async (name: string, color: string) => {
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers(updated);
    }
  }, []);

  if (!loaded) return null;

  return (
    <UserContext.Provider value={{ currentUser, users, signIn, signOut, updateColor }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
