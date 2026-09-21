"use client";

import { toast } from "sonner";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { usePreferencesStore } from "@/lib/preferences";
import type { Framework } from "@/lib/types";
import { cn } from "@/lib/utils";

const FRAMEWORKS: { value: Framework; label: string }[] = [
  { value: "next-react", label: "Next.js + React" },
  { value: "react-vite", label: "React (Vite)" },
  { value: "static-html", label: "Static HTML" },
];

export function PreferencesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { resolvedTheme, setTheme } = useTheme();
  const {
    defaultFramework,
    setDefaultFramework,
    reduceMotion,
    setReduceMotion,
    emailNotifications,
    setEmailNotifications,
  } = usePreferencesStore();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Preferences</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <Label>Appearance</Label>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setTheme("light")}
                className={cn(
                  "forge-focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs transition-colors",
                  resolvedTheme === "light" ? "border-violet bg-violet/10 text-fg" : "border-border text-fg-muted hover:bg-bg-elevated"
                )}
              >
                <Sun className="h-3.5 w-3.5" /> Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={cn(
                  "forge-focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs transition-colors",
                  resolvedTheme === "dark" ? "border-violet bg-violet/10 text-fg" : "border-border text-fg-muted hover:bg-bg-elevated"
                )}
              >
                <Moon className="h-3.5 w-3.5" /> Dark
              </button>
            </div>
          </div>

          <div>
            <Label>Default framework for new projects</Label>
            <div className="mt-2 space-y-1.5">
              {FRAMEWORKS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setDefaultFramework(f.value)}
                  className={cn(
                    "forge-focus-ring flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-xs transition-colors",
                    defaultFramework === f.value ? "border-violet bg-violet/10 text-fg" : "border-border text-fg-muted hover:bg-bg-elevated"
                  )}
                >
                  {f.label}
                  {defaultFramework === f.value && <span className="text-violet">✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Reduce motion</Label>
              <p className="mt-0.5 text-[11px] text-fg-subtle">Turns off animations across BuildAI.</p>
            </div>
            <Switch checked={reduceMotion} onCheckedChange={setReduceMotion} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Email notifications</Label>
              <p className="mt-0.5 text-[11px] text-fg-subtle">Generation finished, errors detected.</p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={(v) => {
                setEmailNotifications(v);
                toast.success(v ? "Email notifications on" : "Email notifications off");
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
