import Link from "next/link";
import {
  ArrowRight,
  FolderTree,
  History,
  MessageSquare,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const steps = [
  {
    n: "01",
    title: "Describe it",
    body: "Write what you need in plain language — “an inventory dashboard for a small business.” No boilerplate, no blank canvas.",
  },
  {
    n: "02",
    title: "BuildAI validates it",
    body: "The brief is compiled into a structured spec — pages, components, routes, and data models — validated before a single file is written.",
  },
  {
    n: "03",
    title: "Iterate in the open",
    body: "Every change happens in a real file explorer and code editor, with a live preview and a version you can always roll back to.",
  },
];

const features = [
  {
    icon: Wand2,
    title: "Structured generation",
    body: "Requests compile to a validated spec — not a wall of code — then persist as real project files.",
  },
  {
    icon: MessageSquare,
    title: "Conversational editing",
    body: "“Make the dashboard darker” or “add a revenue chart” — streamed, cancellable, and aware of your project.",
  },
  {
    icon: FolderTree,
    title: "Real workspace",
    body: "A file explorer, Monaco editor, and live preview — the tool feels like software, not a form.",
  },
  {
    icon: History,
    title: "Version history",
    body: "Every meaningful change is a restorable version, labeled in plain language.",
  },
  {
    icon: ShieldCheck,
    title: "Error recovery",
    body: "Runtime errors are caught, diagnosed by the model, corrected, and re-rendered automatically.",
  },
  {
    icon: MonitorSmartphone,
    title: "Deployment-ready export",
    body: "Download a real project ZIP, with environment variables handled securely.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <BuildMark />
            <span className="text-[15px] font-semibold tracking-tight">BuildAI</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-fg-muted md:flex">
            <a href="#how-it-works" className="hover:text-fg transition-colors">How it works</a>
            <a href="#features" className="hover:text-fg transition-colors">Features</a>
            <Link href="/templates" className="hover:text-fg transition-colors">Templates</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                Start building <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--fg)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--fg)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-24 text-center">
          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-bg-panel px-3 py-1 text-xs text-fg-muted">
            <Sparkles className="h-3 w-3 text-seam" />
            Structured AI generation, not one giant prompt
          </div>
          <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Describe it. Build it.
            <br />
            <span className="text-violet">Ship it.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-fg-muted">
            BuildAI turns a plain-language brief into a real, editable application —
            with a file explorer, a live preview, and version history you actually control.
          </p>
          <div className="mt-9 flex items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg">
                Start building free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/templates">
              <Button variant="secondary" size="lg">Browse templates</Button>
            </Link>
          </div>

          {/* Signature element: the seam splitting to reveal the workspace */}
          <div className="relative mx-auto mt-20 max-w-4xl">
            <div className="seam-line mb-0" />
            <div className="overflow-hidden rounded-t-lg border border-b-0 border-border bg-bg-panel shadow-2xl">
              <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-error/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-seam/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                <span className="ml-3 font-mono text-[11px] text-fg-subtle">inventory-pulse — app/page.tsx</span>
              </div>
              <div className="grid grid-cols-[160px_1fr_200px] text-left text-xs">
                <div className="border-r border-border p-3 font-mono text-fg-subtle">
                  <p className="mb-2 text-[10px] uppercase tracking-wider text-fg-subtle">Explorer</p>
                  <p className="mb-1 text-violet">app/page.tsx</p>
                  <p className="mb-1 text-fg-muted">components/StatGrid.tsx</p>
                  <p className="mb-1 text-fg-muted">components/ReorderTable.tsx</p>
                  <p className="text-fg-muted">lib/data.ts</p>
                </div>
                <div className="border-r border-border p-3 font-mono leading-relaxed">
                  <p><span className="text-indigo">export default function</span> <span className="text-seam">DashboardPage</span>() {"{"}</p>
                  <p className="pl-4 text-fg-muted">return (</p>
                  <p className="pl-8">&lt;<span className="text-violet">main</span>&gt;</p>
                  <p className="pl-12 text-fg-muted">&lt;<span className="text-violet">StatGrid</span> /&gt;</p>
                  <p className="pl-12 text-fg-muted">&lt;<span className="text-violet">ReorderTable</span> /&gt;</p>
                  <p className="pl-8">&lt;/<span className="text-violet">main</span>&gt;</p>
                  <p className="pl-4 text-fg-muted">);</p>
                  <p>{"}"}</p>
                </div>
                <div className="space-y-2 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-fg-subtle">Live preview</p>
                  <div className="rounded-md border border-border bg-bg-inset p-2">
                    <div className="mb-1.5 h-2 w-16 rounded bg-violet/40" />
                    <div className="grid grid-cols-2 gap-1">
                      <div className="h-6 rounded bg-bg-elevated" />
                      <div className="h-6 rounded bg-bg-elevated" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — a real sequence, so numbering earns its keep */}
      <section id="how-it-works" className="border-t border-border bg-bg-panel/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-sm font-medium uppercase tracking-wider text-violet">How it works</h2>
          <p className="mt-2 max-w-lg text-2xl font-semibold tracking-tight">
            Three steps between a sentence and a shippable app.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="relative border-t border-border-strong pt-5">
                <span className="font-mono text-xs text-fg-subtle">{s.n}</span>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-sm font-medium uppercase tracking-wider text-violet">Inside BuildAI</h2>
        <p className="mt-2 max-w-lg text-2xl font-semibold tracking-tight">
          Ten features, built to feel like professional developer software.
        </p>
        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="bg-bg-panel p-6 transition-colors hover:bg-bg-elevated">
              <f.icon className="h-5 w-5 text-violet" strokeWidth={1.75} />
              <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Your next project is one sentence away.</h2>
          <p className="mt-3 text-fg-muted">No credit card. No blank canvas. Just describe what you need.</p>
          <Link href="/signup" className="mt-8 inline-block">
            <Button size="lg">
              Start building free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-xs text-fg-subtle">
          <div className="flex items-center gap-2">
            <BuildMark size={16} />
            <span>BuildAI</span>
          </div>
          <p>Built as a portfolio project. Not affiliated with any third-party product.</p>
        </div>
      </footer>
    </div>
  );
}

function BuildMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="6" className="fill-violet" />
      <path
        d="M7 15.5 12 6l5 9.5"
        stroke="hsl(var(--violet-fg))"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M9 12.5h6" stroke="hsl(var(--seam))" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
