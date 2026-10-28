"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "./lib/user-context";
import { useTheme } from "./lib/theme-context";

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

const ICON_PROPS = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "shrink-0",
};

const MenuIcon = () => (
  <svg {...ICON_PROPS}>
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

const BookIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const GlossaryIcon = () => (
  <svg {...ICON_PROPS}>
    <line x1="9" y1="6" x2="20" y2="6" />
    <line x1="9" y1="12" x2="20" y2="12" />
    <line x1="9" y1="18" x2="20" y2="18" />
    <circle cx="4.5" cy="6" r="1" />
    <circle cx="4.5" cy="12" r="1" />
    <circle cx="4.5" cy="18" r="1" />
  </svg>
);

const ChatsIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const NewChatIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

function NavItem({
  href,
  label,
  icon,
  active,
  expanded,
  italic = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  expanded: boolean;
  italic?: boolean;
}) {
  return (
    <Link
      href={href}
      title={expanded ? undefined : label}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-surface text-text-heading"
          : "text-text-secondary hover:text-text-heading hover:bg-surface-hover"
      }`}
    >
      {icon}
      {/* Label stays in the layout when collapsed (just invisible) so items keep
          the same positions in both states. */}
      <span className={`whitespace-nowrap overflow-hidden transition-opacity ${italic ? "italic" : ""} ${expanded ? "" : "opacity-0"}`}>
        {label}
      </span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, users, signOut, updateColor } = useUser();
  const { dark, toggleTheme } = useTheme();
  const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [chats, setChats] = useState<ChatEntry[]>([]);
  const [openMenu, setOpenMenu] = useState<MenuState | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  // Below the md breakpoint the sidebar starts collapsed and opens as an
  // overlay; on larger screens it pushes the content and remembers its state.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    function apply() {
      setIsMobile(mq.matches);
      if (mq.matches) {
        setOpen(false);
      } else {
        try {
          setOpen(localStorage.getItem("cc-sidebar") !== "collapsed");
        } catch {}
      }
    }
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  function toggleSidebar() {
    const next = !open;
    setOpen(next);
    setOpenMenu(null);
    setShowUserMenu(false);
    if (!isMobile) {
      try {
        localStorage.setItem("cc-sidebar", next ? "open" : "collapsed");
      } catch {}
    }
  }

  useEffect(() => {
    function onRefresh() {
      fetchChats();
    }
    window.addEventListener("chats-updated", onRefresh);
    return () => window.removeEventListener("chats-updated", onRefresh);
  }, [fetchChats]);

  useEffect(() => {
    if (!openMenu && !showUserMenu) return;
    function handleClick(e: MouseEvent) {
      if (openMenu && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [openMenu, showUserMenu]);

  async function handleDelete(chatId: string) {
    setOpenMenu(null);
    await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
    if (pathname === `/chat/${chatId}`) {
      router.push("/chat");
    }
    fetchChats();
  }

  return (
    <div className={`relative shrink-0 h-full transition-[width] duration-200 ${open && !isMobile ? "w-56" : "w-14"}`}>
      {open && isMobile && (
        <div className="fixed inset-0 z-30 bg-black/40" onClick={toggleSidebar} />
      )}
      <aside
        className={`absolute inset-y-0 left-0 z-40 bg-sidebar border-r border-border flex flex-col transition-[width] duration-200 ${
          open ? "w-56" : "w-14"
        } ${open && isMobile ? "shadow-2xl" : ""}`}
      >
      <div className={`flex items-center py-4 ${open ? "justify-between pl-4 pr-2" : "justify-center px-2"}`}>
        {open && (
          <h1 className="text-lg font-semibold text-text-heading whitespace-nowrap overflow-hidden">Common Cents</h1>
        )}
        <button
          onClick={toggleSidebar}
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          title={open ? "Collapse sidebar" : "Expand sidebar"}
          className="w-10 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-heading hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <MenuIcon />
        </button>
      </div>
      <nav
        className="flex flex-col gap-6 px-2 flex-1 overflow-y-auto overflow-x-hidden"
        onClick={(e) => {
          // On mobile the sidebar is an overlay, so close it after picking a page.
          if (isMobile && (e.target as HTMLElement).closest("a")) setOpen(false);
        }}
      >
        <div>
          <p
            aria-hidden={!open}
            className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider text-text-muted whitespace-nowrap transition-opacity ${open ? "" : "opacity-0"}`}
          >
            Wiki
          </p>
          <NavItem href="/wiki" label="Common Cents" icon={<BookIcon />} active={pathname === "/wiki"} expanded={open} />
          <NavItem href="/glossary" label="Glossary" icon={<GlossaryIcon />} active={pathname === "/glossary"} expanded={open} />
        </div>
        <div className="flex flex-col min-h-0">
          <p
            aria-hidden={!open}
            className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider text-text-muted whitespace-nowrap transition-opacity ${open ? "" : "opacity-0"}`}
          >
            Chats
          </p>
          <NavItem href="/chat" label="New Chat" icon={<NewChatIcon />} active={pathname === "/chat"} expanded={open} italic />
          {!open && (
            <button
              onClick={toggleSidebar}
              aria-label="Show saved chats"
              title="Saved chats"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:text-text-heading hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <ChatsIcon />
            </button>
          )}
          {open && (
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
          )}
        </div>
      </nav>

      <div ref={userMenuRef} className="border-t border-border px-2 py-4 relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          title={open ? undefined : currentUser ?? undefined}
          className={`w-full flex items-center gap-2 h-12 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer ${
            open ? "px-3" : "justify-center"
          }`}
        >
          <span
            className="w-7 h-7 rounded-full shrink-0"
            style={{ backgroundColor: currentProfile?.color }}
          />
          {open && (
            <>
              <span className="text-sm font-medium text-text-primary text-left truncate flex-1">
                {currentUser}
              </span>
              <svg className="shrink-0 text-text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </>
          )}
        </button>

        {showUserMenu && (
          <div className="absolute bottom-full left-2 w-52 mb-1 bg-menu border border-border rounded-lg shadow-xl py-1 z-50">
            <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Color
            </p>
            <div className="flex gap-1.5 px-3 pt-1 pb-2">
              {COLOR_PRESETS.map((color) => {
                const taken = takenColors.includes(color);
                const selected = currentProfile?.color === color;
                return (
                  <button
                    key={color}
                    onClick={() => {
                      if (!taken) updateColor(currentUser!, color);
                    }}
                    disabled={taken}
                    aria-label={`Use color ${color}`}
                    className={`w-6 h-6 rounded-full transition-all ${
                      selected ? "ring-2 ring-text-muted ring-offset-1 ring-offset-menu" : ""
                    } ${taken ? "opacity-20 cursor-not-allowed" : "cursor-pointer hover:scale-110"}`}
                    style={{ backgroundColor: color }}
                  />
                );
              })}
            </div>
            <div className="border-t border-border my-1" />
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
            >
              Dark mode
              <span className={`w-9 h-5 rounded-full transition-colors ${dark ? "bg-blue-600" : "bg-surface"} relative inline-block`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${dark ? "translate-x-4" : ""}`} />
              </span>
            </button>
            <button
              onClick={() => {
                setShowUserMenu(false);
                signOut();
              }}
              className="w-full text-left px-3 py-2 text-sm text-delete hover:bg-delete-hover transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
      </aside>
    </div>
  );
}
