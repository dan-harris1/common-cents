"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "./lib/user-context";

interface ChatEntry {
  id: string;
  title: string;
  updatedAt: number;
}

interface MenuState {
  chatId: string;
}

const COLOR_PRESETS = [
  "#4A6FA5",
  "#5A8F68",
  "#7360A5",
  "#2E6E6E",
  "#B07A3F",
  "#7E4A6B",
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, users, signOut, updateColor } = useUser();
  const [chats, setChats] = useState<ChatEntry[]>([]);
  const [openMenu, setOpenMenu] = useState<MenuState | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const currentProfile = users.find((u) => u.name === currentUser);
  const takenColors = users
    .filter((u) => u.name !== currentUser)
    .map((u) => u.color);

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
    if (!openMenu && !showUserMenu && !showColorPicker) return;
    function handleClick(e: MouseEvent) {
      if (openMenu && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (showColorPicker && colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [openMenu, showUserMenu, showColorPicker]);

  async function handleDelete(chatId: string) {
    setOpenMenu(null);
    await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
    if (pathname === `/chat/${chatId}`) {
      router.push("/chat");
    }
    fetchChats();
  }

  return (
    <aside className="w-56 shrink-0 bg-sidebar border-r border-border flex flex-col h-full">
      <div className="px-4 py-4">
        <h1 className="text-lg font-semibold text-text-heading">Common Cents</h1>
      </div>
      <nav className="flex flex-col gap-6 px-2 flex-1 overflow-y-auto">
        <div>
          <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
            Wiki
          </p>
          <Link
            href="/wiki"
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/wiki"
                ? "bg-surface text-text-heading"
                : "text-text-secondary hover:text-text-heading hover:bg-surface-hover"
            }`}
          >
            Common Cents
          </Link>
          <Link
            href="/glossary"
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/glossary"
                ? "bg-surface text-text-heading"
                : "text-text-secondary hover:text-text-heading hover:bg-surface-hover"
            }`}
          >
            Glossary
          </Link>
        </div>
        <div className="flex flex-col min-h-0">
          <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
            Chats
          </p>
          <Link
            href="/chat"
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/chat"
                ? "bg-surface text-text-heading"
                : "text-text-secondary hover:text-text-heading hover:bg-surface-hover"
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
                      ? "bg-surface text-text-heading"
                      : "text-text-secondary hover:text-text-heading hover:bg-surface-hover"
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
                  className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center rounded-r-lg text-ellipsis hover:text-ellipsis-hover opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
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
                    className="absolute right-0 top-full z-50 bg-menu border border-border rounded-lg shadow-xl py-1 min-w-[120px]"
                  >
                    <button
                      onClick={() => handleDelete(chat.id)}
                      className="w-full text-left px-3 py-2 text-sm text-delete hover:bg-delete-hover transition-colors"
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

      <div className="border-t border-border px-2 py-4 relative">
        <div className="flex items-center gap-2 px-3 h-12">
          <button
            onClick={() => { setShowColorPicker(!showColorPicker); setShowUserMenu(false); }}
            className="w-7 h-7 rounded-full shrink-0 cursor-pointer hover:ring-2 hover:ring-text-muted hover:ring-offset-2 hover:ring-offset-sidebar transition-all"
            style={{ backgroundColor: currentProfile?.color }}
          />
          <span className="text-sm font-medium text-text-primary truncate flex-1">
            {currentUser}
          </span>
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowColorPicker(false); }}
            className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>

        {showColorPicker && (
          <div
            ref={colorPickerRef}
            className="absolute bottom-full left-2 mb-1 bg-menu border border-border rounded-lg shadow-xl p-2 z-50 flex gap-1.5"
          >
            {COLOR_PRESETS.map((color) => {
              const taken = takenColors.includes(color);
              const selected = currentProfile?.color === color;
              return (
                <button
                  key={color}
                  onClick={() => {
                    if (!taken) {
                      updateColor(currentUser!, color);
                      setShowColorPicker(false);
                    }
                  }}
                  disabled={taken}
                  className={`w-6 h-6 rounded-full transition-all ${
                    selected ? "ring-2 ring-text-muted ring-offset-1 ring-offset-menu" : ""
                  } ${taken ? "opacity-20 cursor-not-allowed" : "cursor-pointer hover:scale-110"}`}
                  style={{ backgroundColor: color }}
                />
              );
            })}
          </div>
        )}

        {showUserMenu && (
          <div
            ref={userMenuRef}
            className="absolute bottom-full left-2 right-2 mb-1 bg-menu border border-border rounded-lg shadow-xl py-1 z-50"
          >
            <button
              onClick={() => {
                setShowUserMenu(false);
                signOut();
              }}
              className="w-full text-left px-3 py-2 text-sm text-delete hover:bg-delete-hover transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
