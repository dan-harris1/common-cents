// Shared access to the book chapter so the wiki page and the sidebar's table of
// contents read from one fetch and agree on section ids.

// The chapter title (start of the text) followed by its main section headings.
export const SECTION_SELECTOR = ".eBook_Chapter-Name, .eBook_Heading";

export interface ChapterSection {
  id: string;
  title: string;
}

let chapterPromise: Promise<string> | null = null;

// Returns the chapter's <body> HTML, fetched once per page load.
export function loadChapter(): Promise<string> {
  if (!chapterPromise) {
    chapterPromise = fetch("/chapter1.html")
      .then((res) => res.text())
      .then((text) => {
        const match = text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        return match ? match[1] : text;
      })
      .catch((err) => {
        chapterPromise = null;
        throw err;
      });
  }
  return chapterPromise;
}

export function sectionId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// Gives each section heading in `root` an id and returns them in order.
export function tagSections(root: ParentNode): ChapterSection[] {
  return [...root.querySelectorAll<HTMLElement>(SECTION_SELECTOR)].map((el) => {
    const title = (el.textContent || "").trim();
    el.id = sectionId(title);
    return { id: el.id, title };
  });
}

export async function loadSections(): Promise<ChapterSection[]> {
  const doc = new DOMParser().parseFromString(await loadChapter(), "text/html");
  return tagSections(doc.body);
}

// Scrolls the wiki to a section, or to the top of the chapter when id is empty.
export function scrollToSection(id: string, smooth = true) {
  const el = id ? document.getElementById(id) : document.querySelector(".wiki-content");
  el?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
}

// The section the reader is currently in. The wiki updates it while scrolling
// and the sidebar listens for "cc-section" to highlight it.
let currentSection = "";

export function getCurrentSection(): string {
  return currentSection;
}

export function setCurrentSection(id: string) {
  if (id === currentSection) return;
  currentSection = id;
  window.dispatchEvent(new CustomEvent("cc-section", { detail: id }));
}

// The reader's place in the book (like a bookmark), kept only in this browser.
// Separate from the sidebar's open/closed state so either can be cleared alone.
const PLACE_KEY = "cc-place:common-cents";

export interface ReadingPlace {
  section: string;
  offset: number;
  savedAt: number;
}

export function loadPlace(): ReadingPlace | null {
  try {
    const raw = localStorage.getItem(PLACE_KEY);
    return raw ? (JSON.parse(raw) as ReadingPlace) : null;
  } catch {
    return null;
  }
}

export function savePlace(section: string, offset: number) {
  try {
    localStorage.setItem(PLACE_KEY, JSON.stringify({ section, offset, savedAt: Date.now() }));
  } catch {}
}

export function clearPlace() {
  try {
    localStorage.removeItem(PLACE_KEY);
  } catch {}
}
