"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCcw, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBuildStore } from "@/lib/store";
import type { Project, PreviewKind } from "@/lib/types";

interface Theme {
  bg: string;
  panel: string;
  border: string;
  text: string;
  muted: string;
}

const baseStyles = (t: Theme) => `
  * { box-sizing: border-box; }
  body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; background:${t.bg}; color:${t.text}; }
  .wrap { padding: 28px; }
  h1 { font-size: 20px; margin: 0 0 4px; font-weight: 600; }
  .sub { color:${t.muted}; font-size: 13px; margin: 0 0 24px; }
  .grid { display:grid; grid-template-columns: repeat(3,1fr); gap:14px; margin-bottom: 22px; }
  .grid4 { display:grid; grid-template-columns: repeat(4,1fr); gap:12px; margin-bottom: 22px; }
  .card { background:${t.panel}; border:1px solid ${t.border}; border-radius:12px; padding:16px; }
  .card .label { font-size:11px; color:${t.muted}; margin-bottom:6px; }
  .card .value { font-size: 24px; font-weight:600; }
  .accent { height:4px; width:36px; border-radius:99px; margin-bottom: 14px; }
  table { width:100%; border-collapse: collapse; background:${t.panel}; border:1px solid ${t.border}; border-radius:12px; overflow:hidden; }
  th, td { text-align:left; padding:10px 14px; font-size:12.5px; border-bottom:1px solid ${t.border}; }
  th { color:${t.muted}; font-weight:500; }
  tr:last-child td { border-bottom:none; }
  .pill { display:inline-block; padding:2px 8px; border-radius:99px; font-size:11px; }
  .kanban { display:grid; grid-template-columns: repeat(4,1fr); gap:10px; }
  .kanban .col { background:${t.panel}; border:1px solid ${t.border}; border-radius:10px; padding:10px; }
  .kanban .col-title { font-size:11px; color:${t.muted}; margin-bottom:8px; font-weight:500; }
  .kanban .deal { background:${t.bg}; border:1px solid ${t.border}; border-radius:8px; padding:8px; font-size:11px; }
  .bars { display:flex; align-items:flex-end; gap:8px; height:120px; background:${t.panel}; border:1px solid ${t.border}; border-radius:12px; padding:14px; }
  .bar { flex:1; border-radius:4px 4px 0 0; }
  .cs-grid { display:grid; grid-template-columns: repeat(3,1fr); gap:14px; }
  .cs-item { aspect-ratio: 1; background:${t.panel}; border:1px solid ${t.border}; border-radius:12px; display:flex; align-items:flex-end; padding:12px; font-size:12px; font-weight:500; }
  .tiers { display:grid; grid-template-columns: repeat(3,1fr); gap:14px; }
  .tier { background:${t.panel}; border:1px solid ${t.border}; border-radius:12px; padding:16px; }
  .tier .name { font-size:13px; font-weight:500; }
  .tier .price { font-size:20px; font-weight:600; margin-top:6px; }
`;

function statCards(accent: string, items: { label: string; value: string }[]) {
  return `<div class="accent" style="background:${accent}"></div><div class="grid">${items
    .map((i) => `<div class="card"><div class="label">${i.label}</div><div class="value">${i.value}</div></div>`)
    .join("")}</div>`;
}

function renderInventory(p: Project, accent: string) {
  return `
    ${statCards(accent, [
      { label: "Total items", value: "1,204" },
      { label: "Active", value: "982" },
      { label: "Needs attention", value: "18" },
    ])}
    <table>
      <thead><tr><th>Name</th><th>Status</th><th>Updated</th></tr></thead>
      <tbody>
        <tr><td>Ceramic mug — glaze A</td><td><span class="pill" style="background:${accent}22;color:${accent}">In stock</span></td><td>2h ago</td></tr>
        <tr><td>Stoneware bowl</td><td><span class="pill" style="background:${accent}22;color:${accent}">Low</span></td><td>1d ago</td></tr>
        <tr><td>Vase — tall</td><td><span class="pill" style="background:${accent}22;color:${accent}">In stock</span></td><td>3d ago</td></tr>
      </tbody>
    </table>`;
}

function renderTeam(p: Project, accent: string) {
  return `
    ${statCards(accent, [
      { label: "Employees", value: "24" },
      { label: "Open PTO requests", value: "3" },
      { label: "Departments", value: "5" },
    ])}
    <table>
      <thead><tr><th>Name</th><th>Department</th><th>Role</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td>Amara Diallo</td><td>Engineering</td><td>Lead Engineer</td><td><span class="pill" style="background:${accent}22;color:${accent}">Active</span></td></tr>
        <tr><td>Ben Ochieng</td><td>Design</td><td>Product Designer</td><td><span class="pill" style="background:#8886;color:#888">On PTO</span></td></tr>
        <tr><td>Chiara Rossi</td><td>Sales</td><td>Account Exec</td><td><span class="pill" style="background:${accent}22;color:${accent}">Active</span></td></tr>
      </tbody>
    </table>`;
}

function renderFinance(p: Project, accent: string) {
  return `
    ${statCards(accent, [
      { label: "Monthly income", value: "$18,400" },
      { label: "Spent this month", value: "$11,250" },
      { label: "Remaining", value: "$7,150" },
    ])}
    <table>
      <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead>
      <tbody>
        <tr><td>Aug 14</td><td>Payroll</td><td>Contractor invoice</td><td>-$2,400</td></tr>
        <tr><td>Aug 12</td><td>Revenue</td><td>Client payment</td><td>+$6,000</td></tr>
        <tr><td>Aug 09</td><td>Software</td><td>Annual subscription</td><td>-$480</td></tr>
      </tbody>
    </table>`;
}

function renderCrm(p: Project, accent: string) {
  const stages = [
    { title: "Lead", deal: "Kestrel Ltd — $8,000" },
    { title: "Qualified", deal: "Acme Co. — $12,000" },
    { title: "Proposal", deal: "Riverside — $24,500" },
    { title: "Won", deal: "Northline — $6,200" },
  ];
  return `
    ${statCards(accent, [
      { label: "Open deals", value: "31" },
      { label: "Pipeline value", value: "$284k" },
      { label: "Won this month", value: "6" },
    ])}
    <div class="kanban">${stages
      .map((s) => `<div class="col"><div class="col-title">${s.title}</div><div class="deal">${s.deal}</div></div>`)
      .join("")}</div>`;
}

function renderEcommerce(p: Project, accent: string) {
  return `
    ${statCards(accent, [
      { label: "Revenue (30d)", value: "$9,842" },
      { label: "Orders pending", value: "12" },
      { label: "Low stock items", value: "4" },
    ])}
    <table>
      <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th></tr></thead>
      <tbody>
        <tr><td>#1042</td><td>J. Kariuki</td><td><span class="pill" style="background:${accent}22;color:${accent}">Packing</span></td><td>$64.00</td></tr>
        <tr><td>#1041</td><td>M. Otieno</td><td><span class="pill" style="background:${accent}22;color:${accent}">Shipped</span></td><td>$128.00</td></tr>
      </tbody>
    </table>`;
}

function renderAnalytics(p: Project, accent: string) {
  const points = [40, 55, 48, 62, 71, 68, 80];
  return `
    ${statCards(accent, [
      { label: "Monthly active users", value: "42,918" },
      { label: "Conversion rate", value: "3.4%" },
      { label: "Avg. session", value: "6m 12s" },
    ])}
    <div class="bars">${points.map((v) => `<div class="bar" style="height:${v}%;background:${accent}"></div>`).join("")}</div>`;
}

function renderSaas(p: Project, accent: string) {
  return `
    <div class="accent" style="background:${accent}"></div>
    <h1 style="font-size:26px;">Ship your product faster</h1>
    <p class="sub">Everything a small SaaS team needs, in one starter.</p>
    <div class="tiers">
      <div class="tier"><div class="name">Starter</div><div class="price">$19/mo</div></div>
      <div class="tier"><div class="name">Team</div><div class="price">$49/mo</div></div>
      <div class="tier"><div class="name">Scale</div><div class="price">$149/mo</div></div>
    </div>`;
}

function renderLegal(p: Project, accent: string) {
  return `
    ${statCards(accent, [
      { label: "Open cases", value: "17" },
      { label: "Filings due this week", value: "4" },
      { label: "Active clients", value: "29" },
    ])}
    <table>
      <thead><tr><th>Case</th><th>Client</th><th>Next deadline</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td>Doe v. Riverside Co.</td><td>J. Doe</td><td>Aug 26</td><td><span class="pill" style="background:${accent}22;color:${accent}">Discovery</span></td></tr>
        <tr><td>Estate of R. Munene</td><td>R. Munene Family</td><td>Sep 02</td><td><span class="pill" style="background:${accent}22;color:${accent}">Filing</span></td></tr>
      </tbody>
    </table>`;
}

function renderHealthcare(p: Project, accent: string) {
  return `
    ${statCards(accent, [
      { label: "Appointments today", value: "22" },
      { label: "Patients waiting", value: "3" },
      { label: "Active patients", value: "1,204" },
    ])}
    <table>
      <thead><tr><th>Patient</th><th>Appointment</th><th>Provider</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td>A. Njoroge</td><td>10:30 AM</td><td>Dr. Wanjiku</td><td><span class="pill" style="background:${accent}22;color:${accent}">Checked in</span></td></tr>
        <tr><td>S. Kimani</td><td>11:00 AM</td><td>Dr. Wanjiku</td><td><span class="pill" style="background:#8886;color:#888">Scheduled</span></td></tr>
      </tbody>
    </table>`;
}

function renderPortfolio(p: Project, accent: string) {
  return `
    <div class="accent" style="background:${accent}"></div>
    <h1 style="font-size:26px;">Studio Portfolio</h1>
    <p class="sub">Selected case studies.</p>
    <div class="cs-grid">
      <div class="cs-item">Aperture Rebrand</div>
      <div class="cs-item">Northline App</div>
      <div class="cs-item">Kestrel Site</div>
    </div>`;
}

function renderCustom(p: Project, accent: string) {
  // A real AI generation can produce literally any kind of application —
  // there's no sensible fixed mockup to fake here the way there is for
  // BuildAI's own fixed demo projects and templates above. Rather than
  // show misleading placeholder data that has nothing to do with what was
  // actually generated, this honestly says so, and points at the one place
  // that genuinely reflects the real output: the code editor.
  return `
    <div class="accent" style="background:${accent}"></div>
    <div class="card" style="text-align:center; padding:32px 20px;">
      <p style="font-size:13px; font-weight:500; margin-bottom:6px;">Custom AI-generated project</p>
      <p class="sub" style="margin:0;">
        This project's files were generated specifically for your prompt, so there's no
        one-size-fits-all visual preview for it — open the code editor to see exactly what
        was created.
      </p>
    </div>`;
}

const RENDERERS: Record<PreviewKind, (p: Project, accent: string) => string> = {
  inventory: renderInventory,
  team: renderTeam,
  finance: renderFinance,
  crm: renderCrm,
  ecommerce: renderEcommerce,
  analytics: renderAnalytics,
  saas: renderSaas,
  legal: renderLegal,
  healthcare: renderHealthcare,
  portfolio: renderPortfolio,
  custom: renderCustom,
};

function buildPreviewDoc(project: Project, dark: boolean) {
  const theme: Theme = dark
    ? { bg: "#0b0b0e", panel: "#131317", border: "#232329", text: "#f2f2f5", muted: "#9a9aa4" }
    : { bg: "#fafafa", panel: "#ffffff", border: "#e6e6ea", text: "#141417", muted: "#6b6b76" };
  const accent = `hsl(${project.accentHue} 70% ${dark ? 60 : 45}%)`;
  const renderBody = RENDERERS[project.previewKind] ?? renderInventory;

  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>${baseStyles(theme)}</style></head>
  <body>
    <div class="wrap">
      <h1>${project.name}</h1>
      <p class="sub">${project.description}</p>
      ${renderBody(project, accent)}
    </div>
  </body></html>`;
}

export function LivePreview({
  project,
  mode,
  onClose,
}: {
  project: Project;
  mode: "desktop" | "mobile";
  onClose?: () => void;
}) {
  const generating = useBuildStore((s) => s.generating[project.id]);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => setDark(document.documentElement.classList.contains("dark")));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  function refresh() {
    setLoading(true);
    setTimeout(() => setLoading(false), 600);
  }

  function simulateFix() {
    setFixing(true);
    setTimeout(() => {
      setFixing(false);
      setErrorState(false);
      refresh();
    }, 1400);
  }

  return (
    <div className="flex h-full flex-col bg-bg-inset">
      <div className="flex items-center justify-between border-b border-border bg-bg-panel px-3 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Live preview</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setErrorState((v) => !v)}
            className="forge-focus-ring rounded-sm px-1.5 py-0.5 text-[10px] text-fg-subtle hover:bg-bg-elevated"
            title="Demo: toggle a runtime error"
          >
            simulate error
          </button>
          <button onClick={refresh} className="forge-focus-ring rounded-sm p-1 text-fg-subtle hover:bg-bg-elevated hover:text-fg" aria-label="Refresh preview">
            <RefreshCcw className="h-3.5 w-3.5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="forge-focus-ring ml-1 flex items-center gap-1 rounded-md border border-error/30 bg-error/10 px-2 py-1 text-[11px] font-medium text-error transition-colors hover:bg-error/20"
              aria-label="Close preview"
            >
              <X className="h-3 w-3" /> Close preview
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-auto p-4">
        {generating || loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="seam-line w-40" />
            <p className="text-xs text-fg-subtle">Rendering preview…</p>
          </div>
        ) : errorState ? (
          <ErrorPanel fixing={fixing} onFix={simulateFix} />
        ) : (
          <div
            className={`overflow-hidden rounded-lg border border-border-strong bg-white shadow-xl transition-all duration-300 ${
              mode === "mobile" ? "h-[560px] w-[300px]" : "h-full w-full max-w-2xl"
            }`}
          >
            <iframe
              key={mode + dark + project.id}
              title="Live preview"
              className="h-full w-full"
              sandbox="allow-scripts"
              srcDoc={buildPreviewDoc(project, dark)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorPanel({ fixing, onFix }: { fixing: boolean; onFix: () => void }) {
  return (
    <div className="max-w-sm rounded-lg border border-error/25 bg-error/5 p-5 text-center">
      <AlertTriangle className="mx-auto mb-3 h-5 w-5 text-error" />
      <p className="text-sm font-medium text-fg">Preview failed to render</p>
      <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">
        <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px]">
          TypeError: Cannot read properties of undefined (reading &apos;map&apos;)
        </code>{" "}
        in <span className="font-mono">components/ReorderTable.tsx</span>
      </p>
      {fixing ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          <div className="seam-line w-28" />
          <p className="text-xs text-fg-subtle">Diagnosing and applying a fix…</p>
        </div>
      ) : (
        <Button size="sm" className="mt-4" onClick={onFix}>
          <Wand2 className="h-3.5 w-3.5" /> Fix with AI
        </Button>
      )}
    </div>
  );
}
