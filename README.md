# BuildAI

**Describe it. Build it. Ship it.**

Hi — I'm Sandra Valerie. BuildAI is an AI-powered application builder I designed and built: describe what you want in plain language, and it generates a structured, editable application — pages, components, routes, and data models — inside a real developer workspace with a file explorer, a Monaco code editor, a live preview, conversational iterative editing, version history, and AI-assisted error recovery.

If you don't code and want the short, plain-language version of what this project is and why I made the decisions I made, start with **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** instead of this file.

This is a portfolio project built around ten deliberately-scoped features, implemented well rather than a sprawling feature set implemented thinly — plus a real testing strategy and real security practices around the platform itself, not just the visible product features. See **[TESTING.md](./TESTING.md)** and **[SECURITY.md](./SECURITY.md)** for the full breakdown of both.

---

## Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Radix UI, Zustand, TanStack Query, Monaco Editor |
| Backend    | NestJS, Prisma, PostgreSQL |
| Auth       | Firebase Authentication (client) + Firebase Admin SDK (server-side token verification) |
| AI         | Groq (OpenAI-compatible API), structured outputs validated with Zod, Server-Sent Events for streaming |
| Security   | Helmet (secure HTTP headers), rate limiting (`@nestjs/throttler`), server-side authorization checks, CI secret scanning, dependency scanning |
| Testing    | Vitest (frontend unit tests), Jest (backend unit + authorization regression tests), Playwright (end-to-end) |
| Infra      | Docker, Docker Compose, GitHub Actions |
| Deploy     | Vercel (web) · Render/Railway (api) · Neon (Postgres) |

---

## The 10 features

1. **Authentication** — email/password, Google OAuth, password reset, protected routes, server-side Firebase ID token verification. A dedicated **Demo Mode** button on the login and sign-up screens lets anyone explore the product with a shared, clearly-labeled sample account — no sign-up, and nothing is saved.
2. **Project dashboard** — create, rename, delete, duplicate, and open projects. Every real account starts completely empty; sample projects only ever appear inside Demo Mode.
3. **AI application generation** — a plain-language brief becomes a structured spec (pages, components, data models, files), validated with Zod before anything is persisted.
4. **AI chat / iterative editing** — conversational changes to an existing project, streamed over Server-Sent Events, with cancel and regenerate.
5. **Code editor & file explorer** — Monaco-powered editor as one half of the main workspace pane (files reached via a "Files" drawer), with a draggable divider against the AI chat panel — resizable on both desktop and mobile.
6. **Live application preview** — a "Live Preview" toggle in the top bar swaps the code editor for a sandboxed, domain-matched preview of the project (desktop/mobile emulation), still side-by-side with chat so you can keep iterating. Drag the divider to let it fill the screen; a red "Close preview" button in its header brings the editor back.
7. **Version history** — every meaningful AI change is a restorable, labeled version.
8. **AI error detection & recovery** — runtime errors are caught, diagnosed by the model, and corrected automatically.
9. **Project templates** — eight starting points across real business domains (Analytics, SaaS, Legal, Healthcare, Finance, Portfolio, E-commerce, CRM), each with its own matching code and preview — not one generic scaffold reused with different names. Using a template opens an unsaved working copy; a "Save Project" button in the top bar prompts for a name and adds it to Your projects.
10. **Settings & export** — project metadata, environment variables, and a downloadable, deployment-ready ZIP.
11. **Subscriptions & payments** — four billing cycles (Monthly $20, 3 Months $50, 6 Months $110, Yearly $200), payable by card via Stripe or mobile money via M-Pesa's Daraja API. See `apps/api/src/modules/billing/` and the "Payments" section below.
12. **A 10-prompt free tier** — every AI prompt (new-project generation and in-workspace chat edits, combined across every project) counts against a shared limit of 10. Hitting it shows a paywall pointing at `/billing`; an active paid subscription lifts the cap entirely. See `lib/prompt-limit.ts`.

Plus an **interactive onboarding tour** shown automatically the first time someone signs up or enters Demo Mode, walking through generation, templates, the workspace, chat editing, Live Preview, and version history.

---

## Software quality assurance

I treated this as a real engineering practice, not an afterthought — the full plain-language breakdown is in **[TESTING.md](./TESTING.md)**, but in short:

- **Unit tests** (Vitest on the frontend, Jest on the backend) check individual pieces of logic in isolation — e.g. that a brand-new account always starts with zero projects.
- **A regression test permanently guards against a specific class of security bug**: `apps/api/test/authorization.project-access.unit.spec.ts` verifies one person can never read, rename, or delete another person's project.
- **API tests** confirm every endpoint correctly rejects unauthenticated or malformed requests.
- **End-to-end tests** (Playwright) drive a real browser through whole user journeys — signing up, confirming a fresh dashboard is empty, entering Demo Mode and seeing the required warning, toggling light/dark mode.
- **A CI pipeline** (`.github/workflows/ci.yml`) runs all of this automatically on every change, plus secret scanning and dependency vulnerability scanning, before anything can be merged.

```bash
# Frontend unit tests
cd apps/web && npm test

# Backend unit + authorization regression tests
cd apps/api && npm test

# Full end-to-end suite (spins up the web app)
npm run test:e2e   # from the repo root
```

---

## Security

Also fully written up in **[SECURITY.md](./SECURITY.md)**, including an honest dependency-vulnerability report and a lightweight threat model. Highlights:

- **Server-side authorization on every request** — ownership of a project is verified on the backend itself, not just hidden behind a button in the interface.
- **Firebase ID tokens are cryptographically re-verified server-side** on every request, rather than trusting any identity the client claims.
- **Rate limiting** — 100 requests/minute site-wide, a stricter 10/minute specifically on AI endpoints, since those cost real money.
- **Secure HTTP headers** via `helmet`, strict input validation on every endpoint, and CORS locked to the configured front-end origin.
- **Secrets never committed** — all API keys and credentials live in untracked `.env` files, with automated secret scanning in CI as a backstop.
- **AI output is treated as untrusted input**, validated field-by-field against a strict schema (Zod) before anything is saved.
- **The live preview is sandboxed and never executes arbitrary AI-generated code** — a deliberate scope decision, explained in full in SECURITY.md.

---

## Recent fixes worth knowing about

- **AI generation now actually calls the real AI.** Creating a project or sending a chat edit now genuinely calls the real backend (Groq) when a real account and a reachable API exist — previously, the "New Project" dialog created the exact same blank scaffold regardless of the prompt, because the real generation pipeline was fully built but never actually invoked. If the real backend isn't reachable, it falls back to a *prompt-aware* local simulation (matching keywords like "employees," "budget," or "clinic" to a relevant starter kind) rather than one generic template every time.
- **Demo Mode was broken by connecting a real Firebase project**, and is now fixed. The root cause: once real Firebase credentials are present, the app started listening to Firebase's own (real) sign-in state, which immediately overwrote the local Demo Mode session with "nobody's signed in." Demo Mode is now always checked first, independent of whether Firebase is configured.
- **M-Pesa checkout was failing 100% of the time** due to a missing dependency (`libphonenumber-js`) that `class-validator`'s phone number check silently requires. Fixed, and covered by a permanent test.
- **Payment errors were invisible.** NestJS was quietly flattening every billing error — including "Stripe isn't configured" and "M-Pesa isn't configured" — into a generic "Internal server error," making it impossible to tell what was actually wrong. Errors are now translated into clear, specific messages before they reach the browser.

---

## Payments

BuildAI offers four subscription cycles, defined once, on the server, in `apps/api/src/modules/billing/plans.ts`:

| Plan | Price | Billed |
|---|---|---|
| Monthly | $20 | every month |
| 3 Months | $50 | every 3 months |
| 6 Months | $110 | every 6 months |
| Yearly | $200 | every year |

Two payment methods are supported, and the browser never decides the price for either one — it only ever says *which plan* it wants, and the server looks up the real amount itself:

- **Stripe** (card payments) — a hosted Stripe Checkout session is created server-side; card details are entered on Stripe's own page and never pass through BuildAI's server. Confirmed via a signature-verified Stripe webhook, not the browser redirect alone.
- **M-Pesa** (Daraja API / STK Push) — a payment prompt is pushed directly to the person's phone; they approve it with their own M-Pesa PIN, which BuildAI never sees. Confirmed via Safaricom's asynchronous callback. Requires a publicly reachable `MPESA_CALLBACK_URL` (use a tool like ngrok for local development).

Both flows need real credentials to actually process a payment — see `apps/api/.env.example` for exactly which `STRIPE_*` and `MPESA_*` variables are required. Without them, the pricing page still renders (so the product is fully explorable), but starting checkout shows a clear, honest message explaining payments aren't connected yet, rather than pretending to charge someone.

---

## How the code itself is written

Every file in this project is commented as if I were explaining it to someone who has never coded — not just *what* a block of code does, but *why* I built it that way and what I considered instead. If you open any file expecting a wall of unexplained logic, that was a conscious choice to avoid. The most heavily-documented files, if you want a good starting point, are:

- `apps/web/src/lib/store.ts` and `apps/web/src/lib/auth.ts` — the front end's core logic
- `apps/api/src/modules/projects/projects.service.ts` and `firebase-auth.guard.ts` — the authorization and authentication core
- `apps/web/src/components/ui/dialog.tsx` — a real bug I hit and fixed, explained in detail
- `apps/api/src/main.ts` and `app.module.ts` — how the backend starts up and what protects it

---

## Onboarding

First-time sign-up (email, Google once connected, or Demo Mode) triggers a short interactive tour covering generation, templates, the workspace, chat editing, Live Preview, and version history. It's tracked per-account for the browser session, so returning users and regular logins never see it again unless they explicitly re-enter Demo Mode in a new session.

---

## Demo Mode vs. a real account

Until a real Firebase project is connected (see below), every sign-in path is simulated client-side:

- **Email sign-up, email login, and "Continue with Google"** each create a brand-new, uniquely-identified, completely empty account. Without a connected Firebase project, "Continue with Google" deliberately does **not** sign anyone in at all — there's no real account picker to show, so rather than fake a login, it shows a clear message pointing to Demo Mode or email sign-up instead.
- **The "Demo Mode" button** on both the login and sign-up pages is the only way to reach the shared sample account (`demo@account.com` / "Demo User"), which is pre-loaded with diverse example projects (HR, finance, CRM, e-commerce) so the product is explorable at a glance. A confirmation dialog explains that nothing built or edited in Demo Mode is saved, and a persistent badge/banner stays visible for the whole session as a reminder.

Once real Firebase credentials are set in `apps/web/.env.local`, "Continue with Google" opens a real OAuth popup and this simulation is bypassed entirely.

---

## Repository layout

```
apps/
  web/     Next.js frontend
  api/     NestJS backend + Prisma schema
e2e/       Playwright end-to-end tests (run against the web app)
.github/   CI workflow (tests, lint, secret scan, dependency scan)
SECURITY.md          Full security write-up + threat model
TESTING.md           Full QA/testing write-up
PROJECT_OVERVIEW.md  Plain-language explanation for non-coders
DEPLOYMENT.md        Step-by-step free hosting guide (Vercel + Render)
```

Frontend is organized as `components/`, `app/` (routes), `lib/` (state,
types, API client, Firebase). Backend is organized as NestJS `modules/`,
each with its own `controller`, `service`, and `dto/`, plus a shared
`guards/`-equivalent (`firebase-auth.guard.ts`) and `common/` for Prisma and
Firebase Admin setup.

---

## Running it locally

### 1. Frontend only (demo mode — no credentials required)

The frontend ships with a **demo mode**: if no Firebase environment
variables are set, authentication, AI generation, and chat are simulated
in-memory with realistic timing, so the entire product — dashboard,
workspace, streaming chat, versioning, error recovery — is explorable
immediately. Real accounts created this way start empty; use the
**"Demo Mode" button** on the login or sign-up page to load the
pre-populated sample account instead.

```bash
cd apps/web
npm install
npm run dev
```

Visit `http://localhost:3000`.

### 2. Full stack, with a real database, Firebase project, and Groq key

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
# fill in Firebase + Groq + DATABASE_URL values in both files

docker compose up -d postgres
cd apps/api
npm install
npx prisma migrate dev
npm run start:dev

# in a second terminal
cd apps/web
npm install
npm run dev
```

### 3. Everything via Docker Compose

```bash
cp apps/web/.env.example .env
cp apps/api/.env.example .env   # merge both into one .env at the repo root, or export the vars
docker compose up --build
```

---

## Deploying it for real

**[DEPLOYMENT.md](./DEPLOYMENT.md)** has the full, step-by-step process for putting BuildAI on the actual internet using only free hosting (Vercel for the frontend, Render for the backend) — nothing in that guide costs anything to set up.

---

## Notes on scope

The live preview renders a representative snapshot of the generated
application in a sandboxed iframe rather than executing an arbitrary,
in-browser Next.js build — running a full bundler/transpiler pipeline
client-side, and safely sandboxing arbitrary AI-generated code execution,
is its own substantial project on its own (see the "Sandboxed preview"
section of SECURITY.md for the full reasoning). The AI error-recovery flow
is demoed with a "simulate error" control in the preview toolbar; the
underlying `AiService.diagnoseAndFix` pipeline in `apps/api` is fully
implemented against the real Groq API.

A handful of dependency-security findings only have fixes available in
major framework version upgrades (Next.js 16, NestJS 11); these are
tracked and explained honestly in SECURITY.md rather than silently ignored.

---

<sub>Sandra Valerie</sub>
