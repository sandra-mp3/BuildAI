"use client";

import { History, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { useBuildStore } from "@/lib/store";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function VersionHistoryPanel({
  projectId,
  open,
  onClose,
}: {
  projectId: string;
  open: boolean;
  onClose: () => void;
}) {
  const versions = useBuildStore((s) => s.versions[projectId] ?? []);
  const restoreVersion = useBuildStore((s) => s.restoreVersion);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative flex h-full w-80 flex-col border-l border-border bg-bg-panel shadow-2xl animate-fade-up">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-violet" />
            <h2 className="text-sm font-semibold">Version history</h2>
          </div>
          <button onClick={onClose} className="forge-focus-ring rounded-sm p-1 text-fg-subtle hover:text-fg">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <ol className="relative space-y-6 border-l border-border pl-5">
            {[...versions].reverse().map((v, i) => (
              <li key={v.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-[26px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-bg-panel",
                    i === 0 ? "bg-violet" : "bg-border-strong"
                  )}
                />
                <p className="text-[10px] font-mono text-fg-subtle">Version {v.number}</p>
                <p className="mt-0.5 text-sm font-medium">{v.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-fg-muted">{v.description}</p>
                <div className="mt-1.5 flex items-center gap-3 text-[10px] text-fg-subtle">
                  <span>{formatRelativeTime(new Date(v.createdAt))}</span>
                  <span>{v.fileCount} files</span>
                </div>
                {i !== 0 && (
                  <button
                    onClick={() => {
                      restoreVersion(projectId, v.id);
                      toast.success(`Restored version ${v.number}`);
                    }}
                    className="forge-focus-ring mt-2 flex items-center gap-1 rounded-sm text-[11px] text-violet hover:underline"
                  >
                    <RotateCcw className="h-3 w-3" /> Restore this version
                  </button>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
