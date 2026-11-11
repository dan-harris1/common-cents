"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

// The title fades in over ~0.4s (CSS, so it starts at first paint), stays,
// then fades out. HOLD_MS counts from mount and includes the fade-in.
const HOLD_MS = 3400;
const FADE_MS = 400;

// Full-screen "Common Cents" title shown on a fresh load of the book, like the
// title page of a printed book. The page renders underneath it, so when the
// splash fades the reader is already on the text. Deep links (a #section in
// the URL) skip it: the inline script in layout.tsx adds `cc-no-splash` to
// <html> before paint so it never flashes.
export default function Splash() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"show" | "fade" | "gone">(
    pathname === "/wiki" ? "show" : "gone"
  );

  const dismiss = useCallback(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPhase((p) => (p === "show" ? (reduced ? "gone" : "fade") : p));
  }, []);

  useEffect(() => {
    if (phase !== "show") return;
    if (window.location.hash) {
      setPhase("gone");
      return;
    }
    const timer = setTimeout(dismiss, HOLD_MS);
    window.addEventListener("pointerdown", dismiss);
    window.addEventListener("keydown", dismiss);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("keydown", dismiss);
    };
  }, [phase, dismiss]);

  useEffect(() => {
    if (phase === "fade") {
      const timer = setTimeout(() => setPhase("gone"), FADE_MS);
      return () => clearTimeout(timer);
    }
    if (phase === "gone") {
      document.getElementById("main-content")?.focus({ preventScroll: true });
    }
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden={phase === "fade"}
      className="cc-splash fixed inset-0 z-[100] flex items-center justify-center bg-page px-4 transition-opacity ease-out motion-reduce:transition-none"
      style={{ opacity: phase === "fade" ? 0 : 1, transitionDuration: `${FADE_MS}ms` }}
    >
      <h1
        className="cc-splash-title font-display font-semibold tracking-tight text-text-heading whitespace-nowrap select-none"
        style={{ fontSize: "clamp(2.5rem, 11vw, 10rem)" }}
      >
        Common Cents
      </h1>
    </div>
  );
}
