"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-zinc-950 border-r border-zinc-700 flex flex-col">
      <div className="px-4 py-4">
        <h1 className="text-lg font-semibold text-zinc-100">Common Cents</h1>
      </div>
      <nav className="flex flex-col gap-4 px-2">
        <div>
          <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Wiki
          </p>
          <Link
            href="/wiki"
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/wiki"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            Chapter 1
          </Link>
        </div>
        <div>
          <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Chats
          </p>
          <Link
            href="/chat"
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith("/chat")
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            New Chat
          </Link>
        </div>
      </nav>
    </aside>
  );
}
