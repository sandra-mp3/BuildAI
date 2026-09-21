import type { ChatMessage, PreviewKind, Project, ProjectFile, ProjectVersion, Template } from "./types";

function file(id: string, path: string, language: ProjectFile["language"], content: string): ProjectFile {
  return { id, path, language, content };
}

// ---------------------------------------------------------------------------
// Domain-specific file sets. Each one is written to actually look like what
// its project/template name promises, rather than every project sharing one
// generic "inventory" scaffold.
// ---------------------------------------------------------------------------

const TEAM_FILES = (idPrefix: string) => [
  file(`${idPrefix}1`, "app/page.tsx", "typescript",
    `export default function TeamPage() {\n  return (\n    <main className="p-8">\n      <h1 className="text-2xl font-semibold">Team Roster</h1>\n      <TeamStats />\n      <TeamDirectory />\n    </main>\n  );\n}`),
  file(`${idPrefix}2`, "components/TeamStats.tsx", "typescript",
    `const stats = [\n  { label: "Employees", value: "24" },\n  { label: "Open PTO requests", value: "3" },\n  { label: "Departments", value: "5" },\n];\n\nexport function TeamStats() {\n  return (\n    <div className="grid grid-cols-3 gap-4">\n      {stats.map((s) => (\n        <div key={s.label} className="rounded-xl border p-5">\n          <p className="text-sm text-neutral-500">{s.label}</p>\n          <p className="text-3xl font-semibold">{s.value}</p>\n        </div>\n      ))}\n    </div>\n  );\n}`),
  file(`${idPrefix}3`, "components/TeamDirectory.tsx", "typescript",
    `export function TeamDirectory() {\n  return (\n    <table className="w-full text-sm">\n      <thead className="text-left text-neutral-500">\n        <tr><th className="py-2">Name</th><th>Department</th><th>Role</th><th>Status</th></tr>\n      </thead>\n      <tbody>\n        <tr className="border-t"><td className="py-2">Amara Diallo</td><td>Engineering</td><td>Lead Engineer</td><td>Active</td></tr>\n        <tr className="border-t"><td className="py-2">Ben Ochieng</td><td>Design</td><td>Product Designer</td><td>On PTO</td></tr>\n        <tr className="border-t"><td className="py-2">Chiara Rossi</td><td>Sales</td><td>Account Exec</td><td>Active</td></tr>\n      </tbody>\n    </table>\n  );\n}`),
  file(`${idPrefix}4`, "lib/data.ts", "typescript",
    `export interface Employee {\n  id: string;\n  name: string;\n  department: string;\n  role: string;\n  status: "Active" | "On PTO";\n}\n\nexport const employees: Employee[] = [];`),
];

const FINANCE_FILES = (idPrefix: string, orgName: string) => [
  file(`${idPrefix}1`, "app/page.tsx", "typescript",
    `export default function FinancePage() {\n  return (\n    <main className="p-8">\n      <h1 className="text-2xl font-semibold">${orgName}</h1>\n      <BudgetSummary />\n      <TransactionsTable />\n    </main>\n  );\n}`),
  file(`${idPrefix}2`, "components/BudgetSummary.tsx", "typescript",
    `const budgets = [\n  { label: "Monthly income", value: "$18,400" },\n  { label: "Spent this month", value: "$11,250" },\n  { label: "Remaining", value: "$7,150" },\n];\n\nexport function BudgetSummary() {\n  return (\n    <div className="grid grid-cols-3 gap-4">\n      {budgets.map((b) => (\n        <div key={b.label} className="rounded-xl border p-5">\n          <p className="text-sm text-neutral-500">{b.label}</p>\n          <p className="text-3xl font-semibold">{b.value}</p>\n        </div>\n      ))}\n    </div>\n  );\n}`),
  file(`${idPrefix}3`, "components/TransactionsTable.tsx", "typescript",
    `export function TransactionsTable() {\n  return (\n    <table className="w-full text-sm">\n      <thead className="text-left text-neutral-500">\n        <tr><th className="py-2">Date</th><th>Category</th><th>Description</th><th>Amount</th></tr>\n      </thead>\n      <tbody>\n        <tr className="border-t"><td className="py-2">Aug 14</td><td>Payroll</td><td>Contractor invoice</td><td>-$2,400</td></tr>\n        <tr className="border-t"><td className="py-2">Aug 12</td><td>Revenue</td><td>Client payment</td><td>+$6,000</td></tr>\n      </tbody>\n    </table>\n  );\n}`),
  file(`${idPrefix}4`, "lib/data.ts", "typescript",
    `export interface Transaction {\n  id: string;\n  date: string;\n  category: string;\n  amount: number;\n}\n\nexport const transactions: Transaction[] = [];`),
];

const CRM_FILES = (idPrefix: string, orgName: string) => [
  file(`${idPrefix}1`, "app/page.tsx", "typescript",
    `export default function CrmPage() {\n  return (\n    <main className="p-8">\n      <h1 className="text-2xl font-semibold">${orgName}</h1>\n      <PipelineStats />\n      <DealPipeline />\n    </main>\n  );\n}`),
  file(`${idPrefix}2`, "components/PipelineStats.tsx", "typescript",
    `const stats = [\n  { label: "Open deals", value: "31" },\n  { label: "Pipeline value", value: "$284k" },\n  { label: "Won this month", value: "6" },\n];\n\nexport function PipelineStats() {\n  return (\n    <div className="grid grid-cols-3 gap-4">\n      {stats.map((s) => (\n        <div key={s.label} className="rounded-xl border p-5">\n          <p className="text-sm text-neutral-500">{s.label}</p>\n          <p className="text-3xl font-semibold">{s.value}</p>\n        </div>\n      ))}\n    </div>\n  );\n}`),
  file(`${idPrefix}3`, "components/DealPipeline.tsx", "typescript",
    `const stages = ["Lead", "Qualified", "Proposal", "Won"];\n\nexport function DealPipeline() {\n  return (\n    <div className="grid grid-cols-4 gap-3">\n      {stages.map((stage) => (\n        <div key={stage} className="rounded-lg border p-3">\n          <p className="text-xs font-medium text-neutral-500">{stage}</p>\n          <div className="mt-2 rounded-md border bg-neutral-50 p-2 text-xs">Acme Co. — $12,000</div>\n        </div>\n      ))}\n    </div>\n  );\n}`),
  file(`${idPrefix}4`, "lib/data.ts", "typescript",
    `export interface Deal {\n  id: string;\n  company: string;\n  value: number;\n  stage: "Lead" | "Qualified" | "Proposal" | "Won";\n}\n\nexport const deals: Deal[] = [];`),
];

const ECOMMERCE_FILES = (idPrefix: string, shopName: string) => [
  file(`${idPrefix}1`, "app/page.tsx", "typescript",
    `export default function StorefrontPage() {\n  return (\n    <main className="p-8">\n      <h1 className="text-2xl font-semibold">${shopName}</h1>\n      <RevenueStats />\n      <OrderQueue />\n    </main>\n  );\n}`),
  file(`${idPrefix}2`, "components/RevenueStats.tsx", "typescript",
    `const stats = [\n  { label: "Revenue (30d)", value: "$9,842" },\n  { label: "Orders pending", value: "12" },\n  { label: "Low stock items", value: "4" },\n];\n\nexport function RevenueStats() {\n  return (\n    <div className="grid grid-cols-3 gap-4">\n      {stats.map((s) => (\n        <div key={s.label} className="rounded-xl border p-5">\n          <p className="text-sm text-neutral-500">{s.label}</p>\n          <p className="text-3xl font-semibold">{s.value}</p>\n        </div>\n      ))}\n    </div>\n  );\n}`),
  file(`${idPrefix}3`, "components/OrderQueue.tsx", "typescript",
    `export function OrderQueue() {\n  return (\n    <table className="w-full text-sm">\n      <thead className="text-left text-neutral-500">\n        <tr><th className="py-2">Order</th><th>Customer</th><th>Status</th><th>Total</th></tr>\n      </thead>\n      <tbody>\n        <tr className="border-t"><td className="py-2">#1042</td><td>J. Kariuki</td><td>Packing</td><td>$64.00</td></tr>\n        <tr className="border-t"><td className="py-2">#1041</td><td>M. Otieno</td><td>Shipped</td><td>$128.00</td></tr>\n      </tbody>\n    </table>\n  );\n}`),
  file(`${idPrefix}4`, "lib/data.ts", "typescript",
    `export interface Order {\n  id: string;\n  customer: string;\n  status: "Packing" | "Shipped" | "Delivered";\n  total: number;\n}\n\nexport const orders: Order[] = [];`),
];

const ANALYTICS_FILES = (idPrefix: string) => [
  file(`${idPrefix}1`, "app/page.tsx", "typescript",
    `export default function AnalyticsPage() {\n  return (\n    <main className="p-8">\n      <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>\n      <MetricCards />\n      <RevenueChart />\n    </main>\n  );\n}`),
  file(`${idPrefix}2`, "components/MetricCards.tsx", "typescript",
    `const metrics = [\n  { label: "Monthly active users", value: "42,918" },\n  { label: "Conversion rate", value: "3.4%" },\n  { label: "Avg. session", value: "6m 12s" },\n];\n\nexport function MetricCards() {\n  return (\n    <div className="grid grid-cols-3 gap-4">\n      {metrics.map((m) => (\n        <div key={m.label} className="rounded-xl border p-5">\n          <p className="text-sm text-neutral-500">{m.label}</p>\n          <p className="text-3xl font-semibold">{m.value}</p>\n        </div>\n      ))}\n    </div>\n  );\n}`),
  file(`${idPrefix}3`, "components/RevenueChart.tsx", "typescript",
    `export function RevenueChart() {\n  const points = [40, 55, 48, 62, 71, 68, 80];\n  return (\n    <div className="flex h-32 items-end gap-2 rounded-xl border p-4">\n      {points.map((p, i) => (\n        <div key={i} className="flex-1 rounded-t bg-neutral-800" style={{ height: \`\${p}%\` }} />\n      ))}\n    </div>\n  );\n}`),
];

const SAAS_FILES = (idPrefix: string) => [
  file(`${idPrefix}1`, "app/page.tsx", "typescript",
    `export default function MarketingPage() {\n  return (\n    <main className="p-10">\n      <h1 className="text-3xl font-semibold">Ship your product faster</h1>\n      <p className="mt-2 text-neutral-500">Everything a small SaaS team needs, in one starter.</p>\n      <PricingTiers />\n    </main>\n  );\n}`),
  file(`${idPrefix}2`, "components/PricingTiers.tsx", "typescript",
    `const tiers = [\n  { name: "Starter", price: "$19/mo" },\n  { name: "Team", price: "$49/mo" },\n  { name: "Scale", price: "$149/mo" },\n];\n\nexport function PricingTiers() {\n  return (\n    <div className="mt-8 grid grid-cols-3 gap-4">\n      {tiers.map((t) => (\n        <div key={t.name} className="rounded-xl border p-5">\n          <p className="font-medium">{t.name}</p>\n          <p className="mt-1 text-2xl font-semibold">{t.price}</p>\n        </div>\n      ))}\n    </div>\n  );\n}`),
  file(`${idPrefix}3`, "app/(app)/dashboard/page.tsx", "typescript",
    `export default function AppDashboard() {\n  return (\n    <main className="p-8">\n      <h1 className="text-xl font-semibold">Welcome back</h1>\n      <p className="text-sm text-neutral-500">Your authenticated app shell lives here.</p>\n    </main>\n  );\n}`),
];

const LEGAL_FILES = (idPrefix: string) => [
  file(`${idPrefix}1`, "app/page.tsx", "typescript",
    `export default function CasesPage() {\n  return (\n    <main className="p-8">\n      <h1 className="text-2xl font-semibold">Case Tracker</h1>\n      <CaseStats />\n      <CaseTable />\n    </main>\n  );\n}`),
  file(`${idPrefix}2`, "components/CaseStats.tsx", "typescript",
    `const stats = [\n  { label: "Open cases", value: "17" },\n  { label: "Filings due this week", value: "4" },\n  { label: "Active clients", value: "29" },\n];\n\nexport function CaseStats() {\n  return (\n    <div className="grid grid-cols-3 gap-4">\n      {stats.map((s) => (\n        <div key={s.label} className="rounded-xl border p-5">\n          <p className="text-sm text-neutral-500">{s.label}</p>\n          <p className="text-3xl font-semibold">{s.value}</p>\n        </div>\n      ))}\n    </div>\n  );\n}`),
  file(`${idPrefix}3`, "components/CaseTable.tsx", "typescript",
    `export function CaseTable() {\n  return (\n    <table className="w-full text-sm">\n      <thead className="text-left text-neutral-500">\n        <tr><th className="py-2">Case</th><th>Client</th><th>Next deadline</th><th>Status</th></tr>\n      </thead>\n      <tbody>\n        <tr className="border-t"><td className="py-2">Doe v. Riverside Co.</td><td>J. Doe</td><td>Aug 26</td><td>Discovery</td></tr>\n        <tr className="border-t"><td className="py-2">Estate of R. Munene</td><td>R. Munene Family</td><td>Sep 02</td><td>Filing</td></tr>\n      </tbody>\n    </table>\n  );\n}`),
];

const HEALTHCARE_FILES = (idPrefix: string) => [
  file(`${idPrefix}1`, "app/page.tsx", "typescript",
    `export default function PatientPortalPage() {\n  return (\n    <main className="p-8">\n      <h1 className="text-2xl font-semibold">Patient Portal</h1>\n      <ClinicStats />\n      <PatientList />\n    </main>\n  );\n}`),
  file(`${idPrefix}2`, "components/ClinicStats.tsx", "typescript",
    `const stats = [\n  { label: "Appointments today", value: "22" },\n  { label: "Patients waiting", value: "3" },\n  { label: "Active patients", value: "1,204" },\n];\n\nexport function ClinicStats() {\n  return (\n    <div className="grid grid-cols-3 gap-4">\n      {stats.map((s) => (\n        <div key={s.label} className="rounded-xl border p-5">\n          <p className="text-sm text-neutral-500">{s.label}</p>\n          <p className="text-3xl font-semibold">{s.value}</p>\n        </div>\n      ))}\n    </div>\n  );\n}`),
  file(`${idPrefix}3`, "components/PatientList.tsx", "typescript",
    `export function PatientList() {\n  return (\n    <table className="w-full text-sm">\n      <thead className="text-left text-neutral-500">\n        <tr><th className="py-2">Patient</th><th>Appointment</th><th>Provider</th><th>Status</th></tr>\n      </thead>\n      <tbody>\n        <tr className="border-t"><td className="py-2">A. Njoroge</td><td>10:30 AM</td><td>Dr. Wanjiku</td><td>Checked in</td></tr>\n        <tr className="border-t"><td className="py-2">S. Kimani</td><td>11:00 AM</td><td>Dr. Wanjiku</td><td>Scheduled</td></tr>\n      </tbody>\n    </table>\n  );\n}`),
];

const PORTFOLIO_FILES = (idPrefix: string) => [
  file(`${idPrefix}1`, "app/page.tsx", "typescript",
    `export default function PortfolioPage() {\n  return (\n    <main className="p-10">\n      <h1 className="text-3xl font-semibold">Studio Portfolio</h1>\n      <p className="mt-2 text-neutral-500">Selected case studies.</p>\n      <CaseStudyGrid />\n    </main>\n  );\n}`),
  file(`${idPrefix}2`, "components/CaseStudyGrid.tsx", "typescript",
    `const projects = ["Aperture Rebrand", "Northline App", "Kestrel Site"];\n\nexport function CaseStudyGrid() {\n  return (\n    <div className="mt-8 grid grid-cols-3 gap-4">\n      {projects.map((p) => (\n        <div key={p} className="aspect-square rounded-xl border bg-neutral-50 p-4">\n          <p className="text-sm font-medium">{p}</p>\n        </div>\n      ))}\n    </div>\n  );\n}`),
  file(`${idPrefix}3`, "components/ContactForm.tsx", "typescript",
    `export function ContactForm() {\n  return (\n    <form className="mt-10 max-w-sm space-y-3">\n      <input className="w-full rounded-md border p-2 text-sm" placeholder="Your email" />\n      <textarea className="w-full rounded-md border p-2 text-sm" placeholder="Project details" />\n    </form>\n  );\n}`),
];

// Strips the local `id` field so a set of pre-built ProjectFile objects can
// be reused as a Template's file seed (real ids are minted on project creation).
function seedFrom(files: ProjectFile[]): Omit<ProjectFile, "id">[] {
  return files.map(({ id, ...rest }) => rest);
}

/**
 * Looks at the words in someone's generation prompt and guesses which of
 * BuildAI's domain "kinds" it's closest to, so a locally-simulated
 * generation (used when there's no reachable backend to actually ask an AI
 * — see create-project-dialog.tsx) still produces genuinely different
 * starter code depending on what was actually asked for, instead of
 * always the exact same generic scaffold regardless of the prompt.
 */
export function inferKindFromPrompt(prompt: string): PreviewKind {
  const p = prompt.toLowerCase();
  if (/employee|staff|team|hr\b|roster|payroll|hiring/.test(p)) return "team";
  if (/budget|finance|expense|invoice|accounting|ledger|spending/.test(p)) return "finance";
  if (/deal|sales|crm|pipeline|lead|customer relationship/.test(p)) return "crm";
  if (/shop|store|order|inventory|product|ecommerce|e-commerce|retail/.test(p)) return "ecommerce";
  if (/patient|clinic|health|doctor|appointment|hospital/.test(p)) return "healthcare";
  if (/case|client|legal|law\b|attorney|lawyer|litigation/.test(p)) return "legal";
  if (/portfolio|case stud|design work|showcase|photography/.test(p)) return "portfolio";
  if (/pricing|subscription|saas|marketing page|landing page/.test(p)) return "saas";
  return "analytics";
}

/** Returns a ready-to-seed file set matching a given domain kind. */
export function filesForKind(kind: PreviewKind, name: string): Omit<ProjectFile, "id">[] {
  switch (kind) {
    case "team":
      return seedFrom(TEAM_FILES("t"));
    case "finance":
      return seedFrom(FINANCE_FILES("fi", name));
    case "crm":
      return seedFrom(CRM_FILES("cr", name));
    case "ecommerce":
      return seedFrom(ECOMMERCE_FILES("e", name));
    case "healthcare":
      return seedFrom(HEALTHCARE_FILES("h"));
    case "legal":
      return seedFrom(LEGAL_FILES("l"));
    case "portfolio":
      return seedFrom(PORTFOLIO_FILES("p"));
    case "saas":
      return seedFrom(SAAS_FILES("s"));
    default:
      return seedFrom(ANALYTICS_FILES("a"));
  }
}

// ---------------------------------------------------------------------------
// Templates — eight distinct starting points across real business domains.
// ---------------------------------------------------------------------------

export const TEMPLATES: Template[] = [
  {
    id: "tpl-dashboard",
    name: "Analytics Dashboard",
    description: "Traffic metrics, conversion rate, and a revenue trend chart for internal reporting.",
    category: "Dashboard",
    accentHue: 340,
    previewKind: "analytics",
    files: seedFrom(ANALYTICS_FILES("a")),
  },
  {
    id: "tpl-saas",
    name: "SaaS Starter",
    description: "Marketing page, pricing tiers, and an authenticated app shell.",
    category: "SaaS",
    accentHue: 90,
    previewKind: "saas",
    files: seedFrom(SAAS_FILES("s")),
  },
  {
    id: "tpl-legal",
    name: "Legal Case Tracker",
    description: "Case list, client records, and upcoming filing deadlines for a small practice.",
    category: "Legal",
    accentHue: 220,
    previewKind: "legal",
    files: seedFrom(LEGAL_FILES("l")),
  },
  {
    id: "tpl-healthcare",
    name: "Healthcare Patient Portal",
    description: "Appointment schedule, patient check-ins, and provider assignments for a clinic.",
    category: "Healthcare",
    accentHue: 190,
    previewKind: "healthcare",
    files: seedFrom(HEALTHCARE_FILES("h")),
  },
  {
    id: "tpl-finance",
    name: "Finance Budget Planner",
    description: "Monthly budget summary and a transaction ledger for a small business.",
    category: "Finance",
    accentHue: 42,
    previewKind: "finance",
    files: seedFrom(FINANCE_FILES("fn", "Budget Planner")),
  },
  {
    id: "tpl-portfolio",
    name: "Studio Portfolio",
    description: "Case-study grid, project detail pages, and a contact form.",
    category: "Portfolio",
    accentHue: 300,
    previewKind: "portfolio",
    files: seedFrom(PORTFOLIO_FILES("p")),
  },
  {
    id: "tpl-ecommerce",
    name: "Storefront Dashboard",
    description: "Order queue, inventory levels, and revenue breakdowns for a small shop.",
    category: "E-commerce",
    accentHue: 12,
    previewKind: "ecommerce",
    files: seedFrom(ECOMMERCE_FILES("e", "Storefront Dashboard")),
  },
  {
    id: "tpl-crm",
    name: "Pipeline CRM",
    description: "Kanban deal pipeline, contact records, and activity timeline.",
    category: "CRM",
    accentHue: 150,
    previewKind: "crm",
    files: seedFrom(CRM_FILES("c", "Pipeline CRM")),
  },
];

// ---------------------------------------------------------------------------
// "Your projects" sample data — shown only inside Demo Mode. Deliberately
// diverse: HR, finance, sales, and retail, each with matching code.
// ---------------------------------------------------------------------------

export const MOCK_PROJECTS: Project[] = [
  {
    id: "proj-team",
    name: "Team Roster",
    description: "Employee directory, departments, and PTO requests for a 24-person company.",
    framework: "next-react",
    accentHue: 340,
    previewKind: "team",
    createdAt: "2026-07-02T09:12:00Z",
    updatedAt: "2026-08-16T14:40:00Z",
    status: "ready",
    saved: true,
    remote: false,
  },
  {
    id: "proj-finance",
    name: "Ledger — Finance Tracker",
    description: "Monthly budget summary and transaction history for a small business.",
    framework: "next-react",
    accentHue: 42,
    previewKind: "finance",
    createdAt: "2026-06-18T11:00:00Z",
    updatedAt: "2026-08-14T08:05:00Z",
    status: "ready",
    saved: true,
    remote: false,
  },
  {
    id: "proj-crm",
    name: "Northwind CRM",
    description: "Deal pipeline and contact management for a five-person sales team.",
    framework: "next-react",
    accentHue: 90,
    previewKind: "crm",
    createdAt: "2026-06-01T11:00:00Z",
    updatedAt: "2026-08-12T08:05:00Z",
    status: "ready",
    saved: true,
    remote: false,
  },
  {
    id: "proj-storefront",
    name: "Kiln & Co. Storefront",
    description: "Order queue and revenue dashboard for a ceramics e-commerce shop.",
    framework: "react-vite",
    accentHue: 12,
    previewKind: "ecommerce",
    createdAt: "2026-08-01T15:30:00Z",
    updatedAt: "2026-08-10T10:00:00Z",
    status: "ready",
    saved: true,
    remote: false,
  },
];

export const MOCK_FILES: Record<string, ProjectFile[]> = {
  "proj-team": TEAM_FILES("t"),
  "proj-finance": FINANCE_FILES("fi", "Ledger"),
  "proj-crm": CRM_FILES("cr", "Northwind CRM"),
  "proj-storefront": ECOMMERCE_FILES("st", "Kiln & Co. Storefront"),
};

export const MOCK_CHAT: Record<string, ChatMessage[]> = {
  "proj-team": [
    {
      id: "c1",
      role: "user",
      content: "Build a roster for my team with departments and PTO status.",
      createdAt: "2026-07-02T09:12:00Z",
      status: "done",
    },
    {
      id: "c2",
      role: "assistant",
      content:
        "Generated a team directory with department and status columns, plus summary cards for headcount and open PTO requests.",
      createdAt: "2026-07-02T09:12:40Z",
      status: "done",
    },
  ],
  "proj-finance": [
    {
      id: "c1",
      role: "user",
      content: "Track our monthly budget and recent transactions.",
      createdAt: "2026-06-18T11:00:00Z",
      status: "done",
    },
    {
      id: "c2",
      role: "assistant",
      content: "Added a budget summary with income/spend/remaining, and a transactions table below it.",
      createdAt: "2026-06-18T11:02:00Z",
      status: "done",
    },
  ],
};

export const MOCK_VERSIONS: Record<string, ProjectVersion[]> = {
  "proj-team": [
    {
      id: "v1",
      number: 1,
      label: "Initial roster",
      description: "Generated the team directory and headcount cards.",
      createdAt: "2026-07-02T09:12:40Z",
      fileCount: 4,
    },
    {
      id: "v2",
      number: 2,
      label: "Added PTO status column",
      description: "Directory now shows active vs. on-PTO status per employee.",
      createdAt: "2026-08-16T14:40:00Z",
      fileCount: 4,
    },
  ],
  "proj-finance": [
    {
      id: "v1",
      number: 1,
      label: "Initial ledger",
      description: "Generated budget summary and transactions table.",
      createdAt: "2026-06-18T11:02:00Z",
      fileCount: 4,
    },
  ],
  "proj-crm": [
    {
      id: "v1",
      number: 1,
      label: "Initial pipeline",
      description: "Generated the deal pipeline and stats cards.",
      createdAt: "2026-06-01T11:05:00Z",
      fileCount: 4,
    },
  ],
  "proj-storefront": [
    {
      id: "v1",
      number: 1,
      label: "Initial storefront",
      description: "Generated the order queue and revenue stats.",
      createdAt: "2026-08-01T15:35:00Z",
      fileCount: 4,
    },
  ],
};
