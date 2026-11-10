"use client";

import { type ReactNode } from "react";
import Sidebar from "./sidebar";
import Splash from "./splash";
import ThemeToggle from "./theme-toggle";
import { ThemeProvider } from "./lib/theme-context";
import { AdminProvider } from "./lib/admin-context";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AdminProvider>
        <Sidebar />
        {/* On phones the sidebar becomes a drawer behind a 3rem top bar. */}
        <div className="flex-1 min-w-0 h-full pt-12 md:pt-0">{children}</div>
        <ThemeToggle />
        <Splash />
      </AdminProvider>
    </ThemeProvider>
  );
}
