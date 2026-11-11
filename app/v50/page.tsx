import { readFile } from "fs/promises";
import path from "path";
import { LECTURES } from "../lib/lectures";
import LecturesView from "./lectures-view";

// Reads the transcripts at build time and hands them to the client view.
export default async function V50Lectures() {
  const lectures = await Promise.all(
    LECTURES.map(async ({ id, title, file }) => {
      const text = await readFile(path.join(process.cwd(), "content/v50", file), "utf8");
      const paragraphs = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      return { id, title, paragraphs };
    })
  );
  return <LecturesView lectures={lectures} />;
}
