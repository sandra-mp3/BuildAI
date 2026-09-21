"use client";

import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  HeartPulse,
  LayoutDashboard,
  Rows3,
  Scale,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { TopNav } from "@/components/top-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TEMPLATES } from "@/lib/mock-data";
import { useBuildStore } from "@/lib/store";
import type { Template } from "@/lib/types";

const categoryIcon: Record<Template["category"], typeof LayoutDashboard> = {
  Dashboard: LayoutDashboard,
  SaaS: Building2,
  Portfolio: Briefcase,
  "E-commerce": ShoppingCart,
  CRM: Rows3,
  Legal: Scale,
  Healthcare: HeartPulse,
  Finance: Wallet,
};

export default function TemplatesPage() {
  return (
    <RequireAuth>
      <TemplatesPageInner />
    </RequireAuth>
  );
}

function TemplatesPageInner() {
  const router = useRouter();
  const createProject = useBuildStore((s) => s.createProject);

  function applyTemplate(templateId: string) {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    // Not added to "Your projects" yet — that only happens once the user
    // explicitly saves it from inside the workspace.
    const id = createProject({
      name: template.name,
      description: template.description,
      templateHue: template.accentHue,
      previewKind: template.previewKind,
      seedFiles: template.files,
      saved: false,
    });
    router.push(`/project/${id}`);
  }

  return (
    <div className="min-h-screen bg-bg">
      <TopNav />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Start from a shaped foundation, then customize it with AI. You&apos;ll be asked to
          name and save it once you&apos;re happy with it.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => {
            const Icon = categoryIcon[t.category];
            return (
              <Card key={t.id} className="overflow-hidden transition-colors hover:border-border-strong">
                <div
                  className="flex h-28 items-center justify-center"
                  style={{ background: `linear-gradient(135deg, hsl(${t.accentHue} 65% 14%), hsl(${t.accentHue} 35% 6%))` }}
                >
                  <Icon className="h-7 w-7" style={{ color: `hsl(${t.accentHue} 80% 70%)` }} strokeWidth={1.5} />
                </div>
                <div className="p-5">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-fg-subtle">{t.category}</span>
                  <h3 className="mt-1 text-sm font-semibold">{t.name}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">{t.description}</p>
                  <Button size="sm" variant="secondary" className="mt-4 w-full" onClick={() => applyTemplate(t.id)}>
                    Use this template
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
