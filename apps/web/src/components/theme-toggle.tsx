"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label="Toggle color theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "forge-focus-ring relative inline-flex h-8 w-14 items-center rounded-full border border-border bg-bg-elevated transition-colors",
        className
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 translate-x-1 items-center justify-center rounded-full bg-bg-panel border border-border-strong shadow-sm transition-transform duration-300 ease-out",
          mounted && isDark && "translate-x-7"
        )}
      >
        {mounted && isDark ? (
          <Moon className="h-3.5 w-3.5 text-violet" strokeWidth={2} />
        ) : (
          <Sun className="h-3.5 w-3.5 text-seam" strokeWidth={2} />
        )}
      </span>
    </button>
  );
}
