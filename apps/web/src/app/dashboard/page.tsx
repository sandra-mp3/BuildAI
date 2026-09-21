"use client";

import { useEffect, useState } from "react";
import { LayoutTemplate, Plus, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TopNav } from "@/components/top-nav";
import { OnboardingTour } from "@/components/onboarding-tour";
import { useAuthStore } from "@/lib/auth";
import { hasSeenTour, markTourSeen } from "@/lib/onboarding";
import { useBuildStore } from "@/lib/store";
import { CreateProjectDialog } from "./create-project-dialog";
import { ProjectCard } from "./project-card";

export default function DashboardPage() {
  // "Your projects" only ever shows saved projects — a project being
  // customized from a template stays out of this list until it's saved.
  const projects = useBuildStore((s) => s.projects.filter((p) => p.saved));
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const justSignedUp = useAuthStore((s) => s.justSignedUp);
  const setJustSignedUp = useAuthStore((s) => s.setJustSignedUp);

  useEffect(() => {
    if (!user) return;
    if (justSignedUp && !hasSeenTour(user.uid)) {
      setTourOpen(true);
    }
  }, [user, justSignedUp]);

  function finishTour() {
    if (user) markTourSeen(user.uid);
    setJustSignedUp(false);
    setTourOpen(false);
  }

  const filtered = projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-screen bg-bg">
      <TopNav />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your projects</h1>
            <p className="mt-1 text-sm text-fg-muted">{projects.length} project{projects.length !== 1 && "s"}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects"
                className="w-48 pl-8"
              />
            </div>
            <Link href="/templates">
              <Button variant="secondary">
                <LayoutTemplate className="h-3.5 w-3.5" /> Templates
              </Button>
            </Link>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> New project
            </Button>
          </div>
        </div>

        {filtered.length === 0 && projects.length > 0 && (
          <div className="rounded-lg border border-dashed border-border py-20 text-center">
            <p className="text-sm text-fg-muted">No projects match &quot;{query}&quot;.</p>
          </div>
        )}

        {projects.length === 0 && (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-border py-24 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet/10">
              <Plus className="h-5 w-5 text-violet" />
            </div>
            <p className="text-sm font-medium">No projects yet</p>
            <p className="mt-1 max-w-xs text-xs text-fg-muted">
              Describe what you want to build, and BuildAI will scaffold it for you.
            </p>
            <Button onClick={() => setCreateOpen(true)} className="mt-5">
              <Plus className="h-3.5 w-3.5" /> Create your first project
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </main>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
      {tourOpen && <OnboardingTour onFinish={finishTour} />}
    </div>
  );
}
