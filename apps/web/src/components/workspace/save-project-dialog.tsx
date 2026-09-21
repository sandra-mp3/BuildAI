"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/misc";
import { useBuildStore } from "@/lib/store";

export function SaveProjectDialog({
  projectId,
  currentName,
  open,
  onOpenChange,
}: {
  projectId: string;
  currentName: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const saveProject = useBuildStore((s) => s.saveProject);
  const [name, setName] = useState(currentName);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    saveProject(projectId, name.trim());
    toast.success("Saved to Your projects");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Save className="h-4 w-4 text-violet" /> Save this project
          </DialogTitle>
          <DialogDescription className="text-sm text-fg-muted">
            Name it and it&apos;ll appear in &quot;Your projects&quot; on your dashboard, ready to pick up any time.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="save-name">Project name</Label>
            <Input id="save-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={!name.trim()}>
            Save to Your projects
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
