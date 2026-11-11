import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import AppShell from "./app-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Book fonts: Arsenal for body text, Big Shoulders for headings and the title.
const arsenal = localFont({
  variable: "--font-arsenal",
  src: [
    { path: "./fonts/Arsenal/Arsenal-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Arsenal/Arsenal-Italic.ttf", weight: "400", style: "italic" },
    { path: "./fonts/Arsenal/Arsenal-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/Arsenal/Arsenal-BoldItalic.ttf", weight: "700", style: "italic" },
  ],
});

const bigShoulders = localFont({
  variable: "--font-big-shoulders",
  src: [
    { path: "./fonts/BigShoulders/BigShouldersDisplay-Thin.ttf", weight: "100" },
    { path: "./fonts/BigShoulders/BigShouldersDisplay-Light.ttf", weight: "300" },
    { path: "./fonts/BigShoulders/BigShouldersDisplay-Regular.ttf", weight: "400" },
    { path: "./fonts/BigShoulders/BigShouldersDisplay-Medium.ttf", weight: "500" },
    { path: "./fonts/BigShoulders/BigShouldersDisplay-SemiBold.ttf", weight: "600" },
    { path: "./fonts/BigShoulders/BigShouldersDisplay-Bold.ttf", weight: "700" },
    { path: "./fonts/BigShoulders/BigShouldersDisplay-ExtraBold.ttf", weight: "800" },
    { path: "./fonts/BigShoulders/BigShouldersDisplay-Black.ttf", weight: "900" },
  ],
});

export const metadata: Metadata = {
  title: "Common Cents",
  description: "Explore the definition of money",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${arsenal.variable} ${bigShoulders.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(location.hash)document.documentElement.classList.add("cc-no-splash");if(localStorage.getItem("cc-theme")==="light")document.documentElement.classList.remove("dark");localStorage.removeItem("cc-user")}catch(e){}`,
          }}
        />
      </head>
      <body className="h-full flex bg-page">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
