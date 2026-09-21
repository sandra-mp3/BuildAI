"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { FileCode2 } from "lucide-react";
import { useBuildStore } from "@/lib/store";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-xs text-fg-subtle">Loading editor…</div>
  ),
});

export function CodeEditorPane({ projectId }: { projectId: string }) {
  const { resolvedTheme } = useTheme();
  const files = useBuildStore((s) => s.files[projectId] ?? []);
  const activeFileId = useBuildStore((s) => s.activeFileId[projectId]);
  const updateFileContent = useBuildStore((s) => s.updateFileContent);
  const setActiveFile = useBuildStore((s) => s.setActiveFile);

  const activeFile = files.find((f) => f.id === activeFileId) ?? files[0];

  if (!activeFile) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-bg-inset text-fg-subtle">
        <FileCode2 className="h-6 w-6" />
        <p className="text-xs">Select a file to start editing</p>
      </div>
    );
  }

  if (activeFile.id !== activeFileId) setActiveFile(projectId, activeFile.id);

  return (
    <div className="flex h-full flex-col bg-bg-inset">
      <div className="flex items-center gap-2 border-b border-border bg-bg-panel px-3 py-1.5">
        <FileCode2 className="h-3.5 w-3.5 text-violet" />
        <span className="font-mono text-xs text-fg-muted">{activeFile.path}</span>
      </div>
      <div className="flex-1">
        <MonacoEditor
          path={activeFile.path}
          language={activeFile.language}
          value={activeFile.content}
          theme={resolvedTheme === "light" ? "light" : "vs-dark"}
          onChange={(value) => updateFileContent(projectId, activeFile.id, value ?? "")}
          options={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 13,
            minimap: { enabled: false },
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
