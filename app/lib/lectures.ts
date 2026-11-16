// Shared access to the V50 Lectures (public/v50_lectures.html) so the lectures
// page and the sidebar's table of contents read one fetch and agree on ids.
import { sectionId, type ChapterSection } from "./chapter";

// Each part's title (the line under its "Part N" label).
export const LECTURE_SECTION_SELECTOR = ".eBook_Chapter-Name.Chapter-Title";

let lecturesPromise: Promise<string> | null = null;

// Returns the lectures' <body> HTML, fetched once per page load.
export function loadLectures(): Promise<string> {
  if (!lecturesPromise) {
    lecturesPromise = fetch("/v50_lectures.html")
      .then((res) => res.text())
      .then((text) => {
        const match = text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        return match ? match[1] : text;
      })
      .catch((err) => {
        lecturesPromise = null;
        throw err;
      });
  }
  return lecturesPromise;
}

// Gives each part title in `root` an id and returns them in order.
export function tagLectureSections(root: ParentNode): ChapterSection[] {
  return [...root.querySelectorAll<HTMLElement>(LECTURE_SECTION_SELECTOR)].map((el) => {
    const title = (el.textContent || "").trim();
    el.id = `v50-${sectionId(title)}`;
    return { id: el.id, title };
  });
}

export async function loadLectureSections(): Promise<ChapterSection[]> {
  const doc = new DOMParser().parseFromString(await loadLectures(), "text/html");
  return tagLectureSections(doc.body);
}
