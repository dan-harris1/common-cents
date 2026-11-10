"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { useTheme } from "./lib/theme-context";
import { useAdmin } from "./lib/admin-context";
import {
  loadSections,
  scrollToSection,
  getCurrentSection,
  loadPlace,
  type ChapterSection,
} from "./lib/chapter";

interface ChatEntry {
  id: string;
  title: string;
  updatedAt: number;
}

// Open/closed state of each collapsible group, remembered in localStorage.
interface Groups {
  wiki: boolean;
  book: boolean;
  chats: boolean;
}

const GROUPS_KEY = "cc-sidebar-groups";
const DEFAULT_GROUPS: Groups = { wiki: true, book: false, chats: true };

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

const PlusIcon = () => (
  <svg {...ICON_PROPS}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const GearIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 transition-transform duration-150 motion-reduce:transition-none ${open ? "rotate-90" : ""}`}
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

// Slides its children open/closed by animating the grid row from 0fr to 1fr.
function Collapsible({ open, animate, children }: { open: boolean; animate: boolean; children: ReactNode }) {
  return (
    <div
      inert={!open}
      className={`grid ${animate ? "transition-[grid-template-rows,opacity] duration-150 ease-out motion-reduce:transition-none" : ""} ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

// A group label that collapses its group when clicked. In the narrow icon-only
// sidebar it stays in the layout (invisible) so the icons don't shift.
function GroupHeader({
  label,
  open,
  visible,
  onToggle,
}: {
  label: string;
  open: boolean;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-expanded={open}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`w-full flex items-center justify-between pl-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-text-heading whitespace-nowrap transition-[opacity,color] cursor-pointer ${
        visible ? "" : "opacity-0 pointer-events-none"
      }`}
    >
      {label}
      {/* Same width as the Common Cents row's chevron button so they line up. */}
      <span className="w-8 flex justify-center">
        <Chevron open={open} />
      </span>
    </button>
  );
}

function NavItem({
  href,
  label,
  icon,
  active,
  expanded,
  italic = false,
  onClick,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  expanded: boolean;
  italic?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <Link
      href={href}
      title={expanded ? undefined : label}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
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

// Up/Down arrows move focus between the visible links and buttons in `root`.
function handleArrowKeys(e: React.KeyboardEvent<HTMLElement>) {
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  const items = [...e.currentTarget.querySelectorAll<HTMLElement>("a, button")].filter(
    (el) => el.tabIndex >= 0 && !el.closest("[inert]") && el.getClientRects().length > 0
  );
  const index = items.indexOf(document.activeElement as HTMLElement);
  if (index === -1) return;
  e.preventDefault();
  const step = e.key === "ArrowDown" ? 1 : -1;
  items[(index + step + items.length) % items.length].focus();
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { dark, toggleTheme } = useTheme();
  const { admin, signOut } = useAdmin();
  // Desktop: full width or a narrow icon column. Mobile: a drawer that is
  // hidden behind the top bar's menu button until opened.
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [groups, setGroups] = useState<Groups>(DEFAULT_GROUPS);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const [sections, setSections] = useState<ChapterSection[]>([]);
  const [currentSection, setCurrentSection] = useState("");
  const [chats, setChats] = useState<ChatEntry[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Labels show in the mobile drawer and in the full-width desktop sidebar.
  const expanded = isMobile || desktopOpen;
  const onWiki = pathname === "/wiki";

  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch("/api/chats");
      if (res.ok) setChats(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchChats();
    function onRefresh() {
      fetchChats();
    }
    window.addEventListener("chats-updated", onRefresh);
    return () => window.removeEventListener("chats-updated", onRefresh);
  }, [fetchChats]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    function apply() {
      setIsMobile(mq.matches);
      setMobileOpen(false);
    }
    apply();
    try {
      setDesktopOpen(localStorage.getItem("cc-sidebar") !== "collapsed");
    } catch {}
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Restore each group's saved state, then make sure the groups containing the
  // current page are open so the reader can see where they are. Runs once on
  // load only; after that the reader's toggles are respected.
  useEffect(() => {
    let saved: Partial<Groups> = {};
    try {
      saved = JSON.parse(localStorage.getItem(GROUPS_KEY) || "{}");
    } catch {}
    const next = { ...DEFAULT_GROUPS, ...saved };
    if (pathname === "/wiki" || pathname === "/glossary") next.wiki = true;
    if (pathname === "/wiki" && (window.location.hash || loadPlace())) next.book = true;
    if (pathname.startsWith("/chat/") || pathname.startsWith("/questions")) next.chats = true;
    setGroups(next);
    // Let the restored state apply without animating, then enable transitions.
    requestAnimationFrame(() => setGroupsLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadSections().then(setSections).catch(() => {});
    setCurrentSection(getCurrentSection());
    function onSection(e: Event) {
      setCurrentSection((e as CustomEvent<string>).detail);
    }
    window.addEventListener("cc-section", onSection);
    return () => window.removeEventListener("cc-section", onSection);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  useEffect(() => {
    if (!openMenu && !showSettings) return;
    function handleClick(e: MouseEvent) {
      if (openMenu && menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
      if (showSettings && settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [openMenu, showSettings]);

  function toggleGroup(key: keyof Groups) {
    setGroups((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(GROUPS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  function toggleSidebar() {
    setOpenMenu(null);
    setShowSettings(false);
    if (isMobile) {
      setMobileOpen(!mobileOpen);
      return;
    }
    const next = !desktopOpen;
    setDesktopOpen(next);
    try {
      localStorage.setItem("cc-sidebar", next ? "open" : "collapsed");
    } catch {}
  }

  // Already on the wiki: scroll in place instead of navigating. From another
  // page the link navigates and the wiki scrolls to the hash once it loads.
  function goToSection(e: React.MouseEvent, id: string) {
    if (!onWiki) return;
    e.preventDefault();
    history.replaceState(null, "", id ? `#${id}` : "/wiki");
    scrollToSection(id);
  }

  async function handleDelete(chatId: string) {
    setOpenMenu(null);
    await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
    if (pathname === `/chat/${chatId}`) router.push("/chat");
    fetchChats();
  }

  const menuButtonClass =
    "w-10 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-heading hover:bg-surface-hover transition-colors cursor-pointer";

  return (
    <>
      {/* Mobile top bar with the button that opens the drawer. */}
      <div className="md:hidden fixed top-0 inset-x-0 z-20 h-12 flex items-center gap-1 px-2 bg-sidebar border-b border-border">
        <button onClick={toggleSidebar} aria-label="Open sidebar" className={menuButtonClass}>
          <MenuIcon />
        </button>
        <span className="text-base font-semibold text-text-heading">Common Cents</span>
      </div>

      {/* Reserves the sidebar's width on desktop; the sidebar itself is fixed. */}
      <div
        className={`hidden md:block shrink-0 h-full transition-[width] duration-200 motion-reduce:transition-none ${
          desktopOpen ? "w-56" : "w-14"
        }`}
      />

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        inert={isMobile && !mobileOpen}
        className={`fixed inset-y-0 left-0 z-40 w-56 bg-sidebar border-r border-border flex flex-col transition-[width,transform] duration-200 motion-reduce:transition-none ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        } md:translate-x-0 md:shadow-none ${desktopOpen ? "md:w-56" : "md:w-14"}`}
      >
        <div className={`flex items-center py-4 ${expanded ? "justify-between pl-4 pr-2" : "justify-center px-2"}`}>
          {expanded && (
            <h1 className="text-lg font-semibold text-text-heading whitespace-nowrap overflow-hidden">Common Cents</h1>
          )}
          <button
            onClick={toggleSidebar}
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
            title={expanded ? "Collapse sidebar" : "Expand sidebar"}
            className={menuButtonClass}
          >
            <MenuIcon />
          </button>
        </div>

        <nav
          className="flex flex-col gap-8 px-2 pt-3 pb-4 flex-1 overflow-y-auto overflow-x-hidden"
          onKeyDown={handleArrowKeys}
          onClick={(e) => {
            // In the mobile drawer, close it after picking a page.
            if (isMobile && (e.target as HTMLElement).closest("a")) setMobileOpen(false);
          }}
        >
          <div>
            <GroupHeader label="Wiki" open={groups.wiki} visible={expanded} onToggle={() => toggleGroup("wiki")} />
            {/* The narrow icon column always shows every group's icons. */}
            <Collapsible open={!expanded || groups.wiki} animate={groupsLoaded}>
              <div className="relative">
                <NavItem
                  href="/wiki"
                  label="Common Cents"
                  icon={<BookIcon />}
                  active={onWiki}
                  expanded={expanded}
                  onClick={(e) => goToSection(e, "")}
                />
                {expanded && sections.length > 0 && (
                  <button
                    onClick={() => toggleGroup("book")}
                    aria-label={groups.book ? "Hide contents" : "Show contents"}
                    aria-expanded={groups.book}
                    className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center rounded-r-lg text-text-muted hover:text-text-heading transition-colors cursor-pointer"
                  >
                    <Chevron open={groups.book} />
                  </button>
                )}
              </div>
              <Collapsible open={expanded && groups.book} animate={groupsLoaded}>
                <div className="ml-[21px] my-1 pl-1.5 border-l border-border flex flex-col gap-0.5">
                  {sections.map((section) => {
                    const active = onWiki && currentSection === section.id;
                    return (
                      <Link
                        key={section.id}
                        href={`/wiki#${section.id}`}
                        onClick={(e) => goToSection(e, section.id)}
                        aria-current={active ? "location" : undefined}
                        className={`block pl-3.5 pr-3 py-1.5 rounded-lg text-sm leading-snug transition-colors ${
                          active
                            ? "text-text-heading bg-surface-hover font-medium"
                            : "text-text-secondary hover:text-text-heading hover:bg-surface-hover"
                        }`}
                      >
                        {section.title}
                      </Link>
                    );
                  })}
                </div>
              </Collapsible>
              <NavItem href="/glossary" label="Glossary" icon={<GlossaryIcon />} active={pathname === "/glossary"} expanded={expanded} />
            </Collapsible>
          </div>

          <div>
            <GroupHeader label="Chats" open={groups.chats} visible={expanded} onToggle={() => toggleGroup("chats")} />
            <Collapsible open={!expanded || groups.chats} animate={groupsLoaded}>
              <NavItem
                href="/questions"
                label={admin ? "Questions" : "Post a question"}
                icon={<PlusIcon />}
                active={pathname.startsWith("/questions")}
                expanded={expanded}
              />
              <NavItem href="/chat" label="New Chat" icon={<NewChatIcon />} active={pathname === "/chat"} expanded={expanded} italic />
              {!expanded && (
                <button
                  onClick={toggleSidebar}
                  aria-label="Show saved chats"
                  title="Saved chats"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:text-text-heading hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <ChatsIcon />
                </button>
              )}
              {expanded && (
                <div className="flex flex-col mt-1 gap-1 pb-1">
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
                          setOpenMenu(openMenu === chat.id ? null : chat.id);
                        }}
                        aria-label="Chat options"
                        className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center rounded-r-lg text-ellipsis hover:text-ellipsis-hover opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <circle cx="8" cy="3" r="1.5" />
                          <circle cx="8" cy="8" r="1.5" />
                          <circle cx="8" cy="13" r="1.5" />
                        </svg>
                      </button>
                      {openMenu === chat.id && (
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
            </Collapsible>
          </div>
        </nav>

        <div ref={settingsRef} className="border-t border-border px-2 py-4 relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            title={expanded ? undefined : "Settings"}
            aria-label="Settings"
            aria-expanded={showSettings}
            className={`w-full flex items-center gap-3 h-12 rounded-lg text-sm font-medium text-text-secondary hover:text-text-heading hover:bg-surface-hover transition-colors cursor-pointer ${
              expanded ? "px-3" : "justify-center"
            }`}
          >
            <GearIcon />
            {expanded && <span className="whitespace-nowrap">Settings</span>}
          </button>

          {showSettings && (
            <div className="absolute bottom-full left-2 w-52 mb-1 bg-menu border border-border rounded-lg shadow-xl py-1 z-50">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Dark mode
                <span className={`w-9 h-5 rounded-full transition-colors ${dark ? "bg-blue-600" : "bg-surface"} relative inline-block`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${dark ? "translate-x-4" : ""}`} />
                </span>
              </button>
              <div className="border-t border-border my-1" />
              {admin ? (
                <button
                  onClick={() => {
                    setShowSettings(false);
                    signOut();
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  Author sign out
                </button>
              ) : (
                <Link
                  href={pathname === "/admin" ? "/admin" : `/admin?next=${encodeURIComponent(pathname)}`}
                  onClick={() => {
                    setShowSettings(false);
                    if (isMobile) setMobileOpen(false);
                  }}
                  className="block px-3 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors"
                >
                  Author login
                </Link>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
