"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Eye,
  FolderOpen,
  History,
  Monitor,
  Save,
  Settings,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Project } from "@/lib/types";
import { useWorkspaceUi } from "./resizable-workspace";

export function WorkspaceTopBar({
  project,
  saving,
  onToggleExplorer,
  onOpenVersions,
  onSaveProject,
}: {
  project: Project;
  saving: boolean;
  onToggleExplorer: () => void;
  onOpenVersions: () => void;
  onSaveProject: () => void;
}) {
  const router = useRouter();
  const { previewOpen, setPreviewOpen, deviceMode, setDeviceMode } = useWorkspaceUi();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-bg-panel px-3">
      <div className="flex min-w-0 items-center gap-1">
        <button
          onClick={() => router.push("/dashboard")}
          className="forge-focus-ring rounded-md p-1.5 text-fg-muted hover:bg-bg-elevated hover:text-fg"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <Button variant="ghost" size="sm" onClick={onToggleExplorer}>
          <FolderOpen className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Files</span>
        </Button>
        <span className="ml-1 truncate text-sm font-medium">{project.name}</span>
        <span className="hidden items-center gap-1 text-[11px] text-fg-subtle sm:flex">
          {saving ? (
            <>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-seam" /> Saving…
            </>
          ) : (
            <>
              <Check className="h-3 w-3 text-success" /> Saved
            </>
          )}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <div className="hidden items-center gap-0.5 rounded-md border border-border bg-bg-elevated p-0.5 sm:flex">
          <button
            onClick={() => setDeviceMode("desktop")}
            className={`forge-focus-ring rounded-sm p-1.5 transition-colors ${deviceMode === "desktop" ? "bg-bg-panel text-fg" : "text-fg-subtle hover:text-fg"}`}
            aria-label="Desktop preview"
          >
            <Monitor className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeviceMode("mobile")}
            className={`forge-focus-ring rounded-sm p-1.5 transition-colors ${deviceMode === "mobile" ? "bg-bg-panel text-fg" : "text-fg-subtle hover:text-fg"}`}
            aria-label="Mobile preview"
          >
            <Smartphone className="h-3.5 w-3.5" />
          </button>
        </div>

        <Button
          variant={previewOpen ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setPreviewOpen(!previewOpen)}
          className={previewOpen ? "border-violet/40 bg-violet/10 text-fg" : undefined}
        >
          <Eye className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Live Preview</span>
        </Button>
      </div>

      <div className="flex items-center gap-1">
        {!project.saved && (
          <Button size="sm" onClick={onSaveProject}>
            <Save className="h-3.5 w-3.5" /> Save Project
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onOpenVersions}>
          <History className="h-3.5 w-3.5" /> <span className="hidden sm:inline">History</span>
        </Button>
        <button
          onClick={() => router.push(`/project/${project.id}/settings`)}
          className="forge-focus-ring rounded-md p-1.5 text-fg-muted transition-colors hover:bg-bg-elevated hover:text-fg"
          aria-label="Project settings"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
        <div className="ml-1 hidden md:block">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
