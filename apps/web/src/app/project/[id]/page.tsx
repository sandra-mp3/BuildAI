"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { FileExplorer } from "@/components/workspace/file-explorer";
import { SaveProjectDialog } from "@/components/workspace/save-project-dialog";
import { Workspace, WorkspaceUiProvider } from "@/components/workspace/resizable-workspace";
import { WorkspaceTopBar } from "@/components/workspace/top-bar";
import { VersionHistoryPanel } from "@/components/workspace/version-history-panel";
import { useBuildStore } from "@/lib/store";

export default function ProjectWorkspacePage() {
  return (
    <RequireAuth>
      <WorkspaceInner />
    </RequireAuth>
  );
}

function WorkspaceInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const project = useBuildStore((s) => s.projects.find((p) => p.id === params.id));

  const [explorerOpen, setExplorerOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);

  useEffect(() => {
    if (!project) {
      const t = setTimeout(() => router.replace("/dashboard"), 50);
      return () => clearTimeout(t);
    }
  }, [project, router]);

  if (!project) return null;

  return (
    <WorkspaceUiProvider>
      <div className="flex h-screen flex-col bg-bg">
        <WorkspaceTopBar
          project={project}
          saving={false}
          onToggleExplorer={() => setExplorerOpen(true)}
          onOpenVersions={() => setVersionsOpen(true)}
          onSaveProject={() => setSaveOpen(true)}
        />

        {!project.saved && (
          <div className="flex items-center justify-center gap-2 border-b border-seam/25 bg-seam/10 px-4 py-1.5 text-center text-xs text-fg">
            This is an unsaved template preview — click <strong>Save Project</strong> to keep it in Your projects.
          </div>
        )}

        <Workspace project={project} />

        {explorerOpen && (
          <ExplorerDrawer onClose={() => setExplorerOpen(false)}>
            <FileExplorer projectId={project.id} />
          </ExplorerDrawer>
        )}

        <VersionHistoryPanel projectId={project.id} open={versionsOpen} onClose={() => setVersionsOpen(false)} />
        <SaveProjectDialog
          projectId={project.id}
          currentName={project.name}
          open={saveOpen}
          onOpenChange={setSaveOpen}
        />
      </div>
    </WorkspaceUiProvider>
  );
}

function ExplorerDrawer({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative flex h-full w-[85%] max-w-sm flex-col bg-bg-panel shadow-2xl animate-fade-up">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <span className="text-xs font-semibold">Files</span>
          <button onClick={onClose} className="forge-focus-ring rounded-sm p-1 text-fg-subtle hover:text-fg">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
