"use client";

import { useUser } from "./lib/user-context";

export default function LoginScreen() {
  const { users, signIn } = useUser();

  return (
    <div className="h-full w-full flex items-center justify-center bg-page">
      <div className="w-full max-w-sm px-6">
        <h1 className="text-2xl font-semibold text-text-heading text-center mb-8">
          Common Cents
        </h1>
        <p className="text-text-muted text-sm text-center mb-6">
          Select your profile
        </p>
        <div className="flex flex-col gap-3">
          {users.map((user) => (
            <button
              key={user.name}
              onClick={() => signIn(user.name)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <span
                className="w-8 h-8 rounded-full shrink-0"
                style={{ backgroundColor: user.color }}
              />
              <span className="text-text-primary font-medium">{user.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
