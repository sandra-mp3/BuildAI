"use client";

import Link from "next/link";
import { Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/misc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/nav-primitives";
import { useBuildStore } from "@/lib/store";
import type { Project } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import { RenameProjectDialog } from "./rename-project-dialog";

export function ProjectCard({ project }: { project: Project }) {
  const { deleteProject, duplicateProject } = useBuildStore();
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const badgeTone = project.status === "generating" ? "generating" : project.status === "error" ? "error" : "ready";

  return (
    <Card className="group relative overflow-hidden transition-all hover:border-border-strong hover:shadow-lg">
      <Link href={`/project/${project.id}`} className="block">
        <div
          className="relative h-32 border-b border-border"
          style={{
            background: `linear-gradient(135deg, hsl(${project.accentHue} 70% 12%), hsl(${project.accentHue} 40% 6%))`,
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-80">
            <div className="h-14 w-3 rounded-sm bg-white/10" />
            <div className="h-20 w-3 rounded-sm bg-white/15" />
            <div className="h-10 w-3 rounded-sm bg-white/10" />
            <div className="h-16 w-3 rounded-sm" style={{ backgroundColor: `hsl(${project.accentHue} 80% 60% / 0.5)` }} />
          </div>
          <Badge tone={badgeTone} className="absolute right-2.5 top-2.5 bg-black/40 backdrop-blur">
            {project.status}
          </Badge>
        </div>
        <div className="p-4">
          <h3 className="truncate text-sm font-semibold">{project.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-fg-muted">{project.description}</p>
          <p className="mt-3 text-[11px] text-fg-subtle">
            Edited {formatRelativeTime(new Date(project.updatedAt))}
          </p>
        </div>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="forge-focus-ring absolute right-2.5 top-2.5 rounded-md bg-black/40 p-1.5 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
          onClick={(e) => e.preventDefault()}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setRenaming(true)}>
            <Pencil className="h-3.5 w-3.5" /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              duplicateProject(project.id);
              toast.success("Project duplicated");
            }}
          >
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setConfirmingDelete(true)} className="text-error">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameProjectDialog project={project} open={renaming} onOpenChange={setRenaming} />

      {confirmingDelete && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-bg-panel/95 p-4 text-center backdrop-blur-sm animate-fade-in">
          <p className="text-sm font-medium">Delete &quot;{project.name}&quot;?</p>
          <p className="text-xs text-fg-muted">This can&apos;t be undone.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmingDelete(false)}
              className="forge-focus-ring rounded-md border border-border-strong px-3 py-1.5 text-xs hover:bg-bg-elevated"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                deleteProject(project.id);
                toast.success("Project deleted");
              }}
              className="forge-focus-ring rounded-md bg-error/15 px-3 py-1.5 text-xs text-error hover:bg-error/25"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
