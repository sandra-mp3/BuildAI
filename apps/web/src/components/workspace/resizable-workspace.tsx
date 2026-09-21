"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { GripHorizontal, GripVertical } from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { AiChatPanel } from "./ai-chat-panel";
import { CodeEditorPane } from "./code-editor";
import { LivePreview } from "./live-preview";
import type { Project } from "@/lib/types";

// Live Preview mode (on/off) and device emulation (desktop/mobile) are both
// controlled from the top bar, so they're shared via context rather than
// prop-drilled through the workspace tree.
const WorkspaceUiContext = createContext<{
  previewOpen: boolean;
  setPreviewOpen: (v: boolean) => void;
  deviceMode: "desktop" | "mobile";
  setDeviceMode: (m: "desktop" | "mobile") => void;
}>({
  previewOpen: false,
  setPreviewOpen: () => {},
  deviceMode: "desktop",
  setDeviceMode: () => {},
});

export function useWorkspaceUi() {
  return useContext(WorkspaceUiContext);
}

export function WorkspaceUiProvider({ children }: { children: React.ReactNode }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  return (
    <WorkspaceUiContext.Provider value={{ previewOpen, setPreviewOpen, deviceMode, setDeviceMode }}>
      {children}
    </WorkspaceUiContext.Provider>
  );
}

function useIsWideScreen() {
  const [isWide, setIsWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsWide(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsWide(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isWide;
}

function HandleX() {
  return (
    <PanelResizeHandle className="resize-handle-x group relative">
      <span className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 rounded-sm bg-bg-elevated p-0.5 text-fg-subtle group-hover:flex md:flex">
        <GripVertical className="h-3 w-3" />
      </span>
    </PanelResizeHandle>
  );
}

function HandleY() {
  return (
    <PanelResizeHandle className="resize-handle-y group relative">
      <span className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 rounded-sm bg-bg-elevated p-0.5 text-fg-subtle group-hover:flex">
        <GripHorizontal className="h-3 w-3" />
      </span>
    </PanelResizeHandle>
  );
}

/**
 * Two panes, always: on the left/top, either the code editor or (when Live
 * Preview is toggled on from the top bar) the live preview — and on the
 * right/bottom, the AI chat. The divider between them is fully drag-
 * resizable in both directions, so the preview can be dragged all the way
 * to the edge to fill the screen, on desktop and mobile alike.
 */
export function Workspace({ project }: { project: Project }) {
  const { previewOpen, setPreviewOpen, deviceMode } = useWorkspaceUi();
  const isWide = useIsWideScreen();
  const direction = isWide ? "horizontal" : "vertical";
  const Handle = isWide ? HandleX : HandleY;

  return (
    <PanelGroup
      key={`${direction}-${previewOpen ? "preview" : "editor"}`}
      direction={direction}
      autoSaveId={`buildai-workspace-${direction}-${previewOpen ? "preview" : "editor"}`}
      className="flex min-h-0 flex-1"
    >
      <Panel defaultSize={62} minSize={20} className="min-h-0">
        {previewOpen ? (
          <LivePreview project={project} mode={deviceMode} onClose={() => setPreviewOpen(false)} />
        ) : (
          <CodeEditorPane projectId={project.id} />
        )}
      </Panel>
      <Handle />
      <Panel defaultSize={38} minSize={0} className="min-h-0">
        <AiChatPanel projectId={project.id} />
      </Panel>
    </PanelGroup>
  );
}
