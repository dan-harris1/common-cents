"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface ChatEntry {
  id: string;
  title: string;
  updatedAt: number;
}

interface MenuState {
  chatId: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [chats, setChats] = useState<ChatEntry[]>([]);
  const [openMenu, setOpenMenu] = useState<MenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch("/api/chats");
      if (res.ok) setChats(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    function onRefresh() {
      fetchChats();
    }
    window.addEventListener("chats-updated", onRefresh);
    return () => window.removeEventListener("chats-updated", onRefresh);
  }, [fetchChats]);

  useEffect(() => {
    if (!openMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [openMenu]);

  async function handleDelete(chatId: string) {
    setOpenMenu(null);
    await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
    if (pathname === `/chat/${chatId}`) {
      router.push("/chat");
    }
    fetchChats();
  }

  return (
    <aside className="w-56 shrink-0 bg-zinc-950 border-r border-zinc-700 flex flex-col h-full">
      <div className="px-4 py-4">
        <h1 className="text-lg font-semibold text-zinc-100">Common Cents</h1>
      </div>
      <nav className="flex flex-col gap-4 px-2 flex-1 overflow-y-auto">
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
        <div className="flex flex-col min-h-0">
          <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Chats
          </p>
          <Link
            href="/chat"
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/chat"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <span className="italic">New Chat</span>
          </Link>
          <div className="flex flex-col mt-1 gap-1">
            {chats.map((chat) => (
              <div key={chat.id} className="group relative">
                <Link
                  href={`/chat/${chat.id}`}
                  className={`block px-3 py-2 pr-8 rounded-lg text-sm transition-colors truncate ${
                    pathname === `/chat/${chat.id}`
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  }`}
                >
                  {chat.title}
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenMenu(openMenu?.chatId === chat.id ? null : { chatId: chat.id });
                  }}
                  className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center rounded-r-lg text-zinc-500 hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="8" cy="3" r="1.5" />
                    <circle cx="8" cy="8" r="1.5" />
                    <circle cx="8" cy="13" r="1.5" />
                  </svg>
                </button>
                {openMenu?.chatId === chat.id && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 top-full z-50 bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl py-1 min-w-[120px]"
                  >
                    <button
                      onClick={() => handleDelete(chat.id)}
                      className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-zinc-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
}
