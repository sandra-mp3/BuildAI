/**
 * LAYOUT.TSX (the root layout)
 * ----------------------------
 * In Next.js (the framework this whole front-end is built with), a file
 * named `layout.tsx` wraps around every page "below" it in the folder
 * structure. This particular one, at the very top of the `app/` folder,
 * wraps around literally every single page in BuildAI — the landing page,
 * login, the dashboard, the project workspace, all of it. Whatever I put
 * here runs once and applies everywhere, which makes it the right place
 * for three things: loading fonts, deciding light vs. dark mode, and
 * showing pop-up notifications ("toasts").
 *
 * WHY I PUT THESE THINGS HERE
 * ---------------------------
 * 1. Fonts (Geist Sans and Geist Mono): I load them once, here, instead of
 *    in every page, so the browser only has to download them a single
 *    time no matter how many pages someone visits.
 * 2. ThemeProvider: this is what remembers whether someone prefers light
 *    or dark mode and makes that choice available to every component in
 *    the app, without me having to pass it down manually page by page.
 * 3. Toaster: this renders the small "Project renamed" / "Saved to Your
 *    projects" style pop-up messages. Putting it here means any page can
 *    trigger one without needing to set anything up itself.
 * 4. Watermark: my name, shown quietly in the corner of every page — see
 *    watermark.tsx for why.
 */

import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { Watermark } from "@/components/watermark";
import "./globals.css";

// This is what shows up in the browser tab and in search engine results —
// it's separate from anything visible on the page itself.
export const metadata: Metadata = {
  title: "BuildAI — Describe it. Build it. Ship it.",
  description:
    "BuildAI turns a plain-language brief into a structured, editable application — pages, components, and data models generated, validated, and ready to iterate on.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      // Without this, React would log a harmless-but-noisy warning: the
      // theme (light/dark) can only be determined once the page loads in
      // the browser, so the very first render on the server and the first
      // render in the browser won't perfectly match on purpose. This tells
      // React "that mismatch is expected here, don't warn about it."
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <ThemeProvider>
          {/* `children` is however Next.js swaps in — whichever actual page
              the person is currently visiting. */}
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: "!bg-bg-elevated !border !border-border !text-fg",
            }}
          />
          <Watermark />
        </ThemeProvider>
      </body>
    </html>
  );
}
