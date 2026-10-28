"use client";

import { type ReactNode } from "react";
import { UserProvider, useUser } from "./lib/user-context";
import Sidebar from "./sidebar";
import ThemeToggle from "./theme-toggle";
import LoginScreen from "./login";
import { ThemeProvider } from "./lib/theme-context";

function AppContent({ children }: { children: ReactNode }) {
  const { currentUser } = useUser();

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 min-w-0 h-full">{children}</div>
      <ThemeToggle />
    </>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <UserProvider>
        <AppContent>{children}</AppContent>
      </UserProvider>
    </ThemeProvider>
  );
}
