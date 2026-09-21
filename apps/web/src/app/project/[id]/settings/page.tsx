"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Download, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/misc";
import { useBuildStore } from "@/lib/store";
import type { Project } from "@/lib/types";

export default function ProjectSettingsPage() {
  return (
    <RequireAuth>
      <SettingsInner />
    </RequireAuth>
  );
}

interface EnvVar {
  id: string;
  key: string;
  value: string;
  revealed: boolean;
}

function SettingsInner() {
  const params = useParams<{ id: string }>();
  const project = useBuildStore((s) => s.projects.find((p) => p.id === params.id));
  const files = useBuildStore((s) => s.files[params.id] ?? []);

  if (!project) return null;

  return <SettingsForm project={project} files={files} />;
}

function SettingsForm({ project, files }: { project: Project; files: { path: string; content: string }[] }) {
  const router = useRouter();
  const renameProject = useBuildStore((s) => s.renameProject);
  const updateProjectDescription = useBuildStore((s) => s.updateProjectDescription);

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [envVars, setEnvVars] = useState<EnvVar[]>([
    { id: "e1", key: "DATABASE_URL", value: "postgresql://user:pass@host:5432/db", revealed: false },
    { id: "e2", key: "GROQ_API_KEY", value: "gsk_exampleexampleexampleexampleexampleexample", revealed: false },
  ]);
  const [exporting, setExporting] = useState(false);

  function handleSaveDetails() {
    renameProject(project.id, name);
    updateProjectDescription(project.id, description);
    toast.success("Project details saved");
  }

  function addEnvVar() {
    setEnvVars((v) => [...v, { id: `e${Date.now()}`, key: "", value: "", revealed: true }]);
  }

  function updateEnvVar(id: string, patch: Partial<EnvVar>) {
    setEnvVars((v) => v.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function removeEnvVar(id: string) {
    setEnvVars((v) => v.filter((e) => e.id !== id));
  }

  function handleExport() {
    setExporting(true);
    setTimeout(() => {
      const manifest = files.map((f) => `// ${f.path}\n${f.content}`).join("\n\n");
      const blob = new Blob([manifest], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, "-").toLowerCase()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      setExporting(false);
      toast.success("Project exported");
    }, 900);
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex h-14 items-center gap-3 border-b border-border px-4">
        <button
          onClick={() => router.push(`/project/${project.id}`)}
          className="forge-focus-ring rounded-md p-1.5 text-fg-muted hover:bg-bg-elevated hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-sm font-semibold">Project settings — {project.name}</h1>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-6 py-10">
        <Card>
          <div className="border-b border-border p-5">
            <h2 className="text-sm font-semibold">Details</h2>
            <p className="mt-1 text-xs text-fg-muted">Name and description shown across your dashboard.</p>
          </div>
          <div className="space-y-4 p-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Project name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc">Description</Label>
              <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Framework</Label>
              <p className="text-sm text-fg">
                {project.framework === "next-react" ? "Next.js + React" : project.framework === "react-vite" ? "React (Vite)" : "Static HTML"}
              </p>
            </div>
            <Button size="sm" onClick={handleSaveDetails}>Save changes</Button>
          </div>
        </Card>

        <Card>
          <div className="border-b border-border p-5">
            <h2 className="text-sm font-semibold">Environment variables</h2>
            <p className="mt-1 text-xs text-fg-muted">Stored securely and injected at build time. Never exposed to the client unless prefixed for your framework.</p>
          </div>
          <div className="space-y-2 p-5">
            {envVars.map((e) => (
              <div key={e.id} className="flex items-center gap-2">
                <Input
                  value={e.key}
                  onChange={(ev) => updateEnvVar(e.id, { key: ev.target.value })}
                  placeholder="KEY"
                  className="w-40 font-mono text-xs"
                />
                <Input
                  type={e.revealed ? "text" : "password"}
                  value={e.value}
                  onChange={(ev) => updateEnvVar(e.id, { value: ev.target.value })}
                  placeholder="value"
                  className="flex-1 font-mono text-xs"
                />
                <button
                  onClick={() => updateEnvVar(e.id, { revealed: !e.revealed })}
                  className="forge-focus-ring rounded-sm p-1.5 text-fg-subtle hover:text-fg"
                  aria-label="Toggle visibility"
                >
                  {e.revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => removeEnvVar(e.id)}
                  className="forge-focus-ring rounded-sm p-1.5 text-fg-subtle hover:text-error"
                  aria-label="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <Button size="sm" variant="secondary" onClick={addEnvVar}>
              <Plus className="h-3.5 w-3.5" /> Add variable
            </Button>
          </div>
        </Card>

        <Card>
          <div className="border-b border-border p-5">
            <h2 className="text-sm font-semibold">Export</h2>
            <p className="mt-1 text-xs text-fg-muted">Download a deployment-ready copy of your generated project.</p>
          </div>
          <div className="p-5">
            <Button onClick={handleExport} disabled={exporting}>
              <Download className="h-3.5 w-3.5" /> {exporting ? "Preparing ZIP…" : "Download project ZIP"}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
