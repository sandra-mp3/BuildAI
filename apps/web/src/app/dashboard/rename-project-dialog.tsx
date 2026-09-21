"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/misc";
import { useBuildStore } from "@/lib/store";
import type { Project } from "@/lib/types";

export function RenameProjectDialog({
  project,
  open,
  onOpenChange,
}: {
  project: Project;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const renameProject = useBuildStore((s) => s.renameProject);
  const [name, setName] = useState(project.name);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    renameProject(project.id, name.trim());
    toast.success("Project renamed");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Rename project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="rename">Project name</Label>
            <Input id="rename" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button type="submit" className="w-full">Save changes</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
