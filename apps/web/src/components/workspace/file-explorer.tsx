"use client";

import { useMemo, useState } from "react";
import { ChevronRight, File, FilePlus, Folder, FolderPlus, FolderOpen } from "lucide-react";
import { useBuildStore } from "@/lib/store";
import type { ProjectFile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TreeNode {
  name: string;
  path: string;
  isFile: boolean;
  file?: ProjectFile;
  children: Map<string, TreeNode>;
}

function buildTree(files: ProjectFile[]): TreeNode {
  const root: TreeNode = { name: "", path: "", isFile: false, children: new Map() };
  for (const file of files) {
    const parts = file.path.split("/");
    let cur = root;
    let acc = "";
    parts.forEach((part, i) => {
      acc = acc ? `${acc}/${part}` : part;
      const isFile = i === parts.length - 1;
      if (!cur.children.has(part)) {
        cur.children.set(part, { name: part, path: acc, isFile, file: isFile ? file : undefined, children: new Map() });
      }
      cur = cur.children.get(part)!;
    });
  }
  return root;
}

function TreeItem({
  node,
  depth,
  activeFileId,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  activeFileId?: string;
  onSelect: (file: ProjectFile) => void;
}) {
  const [open, setOpen] = useState(true);

  if (node.isFile && node.file) {
    const isActive = node.file.id === activeFileId;
    return (
      <button
        onClick={() => onSelect(node.file!)}
        className={cn(
          "forge-focus-ring flex w-full items-center gap-1.5 rounded-sm py-1 pr-2 text-left text-xs transition-colors hover:bg-bg-elevated",
          isActive && "bg-violet/10 text-violet"
        )}
        style={{ paddingLeft: depth * 14 + 22 }}
      >
        <File className="h-3.5 w-3.5 shrink-0 opacity-70" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  const children = Array.from(node.children.values()).sort((a, b) => {
    if (a.isFile === b.isFile) return a.name.localeCompare(b.name);
    return a.isFile ? 1 : -1;
  });

  return (
    <div>
      {depth >= 0 && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="forge-focus-ring flex w-full items-center gap-1 rounded-sm py-1 pr-2 text-left text-xs text-fg-muted transition-colors hover:bg-bg-elevated"
          style={{ paddingLeft: depth * 14 + 4 }}
        >
          <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open && "rotate-90")} />
          {open ? <FolderOpen className="h-3.5 w-3.5 shrink-0" /> : <Folder className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate">{node.name}</span>
        </button>
      )}
      {open &&
        children.map((child) => (
          <TreeItem key={child.path} node={child} depth={depth + 1} activeFileId={activeFileId} onSelect={onSelect} />
        ))}
    </div>
  );
}

export function FileExplorer({ projectId }: { projectId: string }) {
  const files = useBuildStore((s) => s.files[projectId] ?? []);
  const activeFileId = useBuildStore((s) => s.activeFileId[projectId]);
  const setActiveFile = useBuildStore((s) => s.setActiveFile);
  const createFile = useBuildStore((s) => s.createFile);
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  const tree = useMemo(() => buildTree(files), [files]);
  const rootChildren = Array.from(tree.children.values()).sort((a, b) => {
    if (a.isFile === b.isFile) return a.name.localeCompare(b.name);
    return a.isFile ? 1 : -1;
  });

  function handleCreate() {
    if (!newFileName.trim()) return;
    createFile(projectId, newFileName.trim());
    setNewFileName("");
    setNewFileOpen(false);
  }

  return (
    <div className="flex h-full flex-col bg-bg-panel">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Explorer</span>
        <div className="flex gap-1">
          <button onClick={() => setNewFileOpen((v) => !v)} className="forge-focus-ring rounded-sm p-1 text-fg-subtle hover:bg-bg-elevated hover:text-fg" aria-label="New file">
            <FilePlus className="h-3.5 w-3.5" />
          </button>
          <button className="forge-focus-ring rounded-sm p-1 text-fg-subtle hover:bg-bg-elevated hover:text-fg" aria-label="New folder">
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {newFileOpen && (
        <div className="border-b border-border p-2">
          <input
            autoFocus
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="components/NewFile.tsx"
            className="forge-focus-ring w-full rounded-sm border border-border bg-bg-elevated px-2 py-1 font-mono text-[11px]"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-1.5">
        {rootChildren.map((child) => (
          <TreeItem key={child.path} node={child} depth={0} activeFileId={activeFileId} onSelect={(f) => setActiveFile(projectId, f.id)} />
        ))}
        {files.length === 0 && <p className="px-3 py-4 text-xs text-fg-subtle">No files yet.</p>}
      </div>
    </div>
  );
}
