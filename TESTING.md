# Testing — how I made sure BuildAI actually works

Hi, it's Sandra Valerie again. This document is about "quality assurance" (usually shortened to "QA") — the practice of checking that software actually does what it's supposed to, on purpose and repeatedly, instead of just hoping it does. I want to explain this in plain terms, because "testing" can sound like a vague, abstract thing if you've never written code — but the idea behind it is actually very simple: **write down what "working correctly" means, once, as code, so a computer can re-check it automatically, forever, instead of a person having to click through the whole app by hand every single time something changes.**

I used four different kinds of tests here, because each one answers a different question.

---

## 1. Unit tests — "does this one small piece of logic work?"

A unit test checks one small, self-contained rule in complete isolation — no browser, no server, no database, just "if I give this function these inputs, do I get exactly the result I expect?"

**Where:** `apps/web/src/lib/*.test.ts` (using a tool called Vitest) and `apps/api/test/*.unit.spec.ts` (using a tool called Jest).

**Example, in plain terms:** One of my unit tests checks that a brand-new project always starts with a completely blank list of projects. That sounds obvious, but it's exactly the kind of rule that's easy to accidentally break later while working on something unrelated — early on in building this, new accounts actually *were* accidentally pre-filled with sample data, which was a real bug I fixed. Writing a test for it means that specific mistake can never quietly come back without me noticing immediately, because the test would fail the moment it did.

**Run them yourself:**
```bash
cd apps/web && npm test
cd apps/api && npm test
```

---

## 2. Regression tests — "did a bug I already fixed come back?"

A regression test is a special kind of unit test written *because* something specific once went wrong (or, as a precaution, realistically could go wrong). Its only job is making sure that exact problem can never silently return.

The clearest example in this project is `apps/api/test/authorization.project-access.unit.spec.ts`. It permanently checks that one person can never read, rename, or delete another person's project — a serious category of bug called "broken access control." I didn't just fix this and move on; I gave it its own named, permanent test, so every future change to the project code gets automatically re-checked against this exact rule, forever, as part of the same pipeline described below.

Money gets the same treatment: `apps/api/test/billing-plans.unit.spec.ts` permanently checks that the four advertised prices ($20/$50/$110/$200) actually match what the checkout code calculates, and that an invalid or made-up plan id is correctly refused rather than silently accepted.

Two more recent examples worth mentioning specifically, because they're both real bugs this project actually hit: `apps/api/test/mpesa-checkout-dto.unit.spec.ts` guards against a missing dependency that silently made every M-Pesa checkout fail, and `apps/api/test/billing-error-surfacing.unit.spec.ts` guards against payment errors being flattened into an unhelpful generic message before ever reaching the browser. On the frontend, `apps/web/src/lib/store.test.ts` includes a test proving that different prompts actually produce different starter projects — a direct regression test for the exact "every project looks the same" bug this app once had.

---

## 3. API tests — "does the backend handle both good and bad requests correctly?"

It's not enough to test that the *front end* looks right — a real attacker, or just a careless script, could talk to the backend directly, skipping the website entirely. So I also test the API itself, independent of any browser.

**Where:** `apps/api/test/*.e2e-spec.ts`.

**What they check:** for example, that every project-related endpoint correctly refuses a request with no valid login token attached (a `401 Unauthorized` response), rather than accidentally letting it through.

---

## 4. End-to-end (E2E) tests — "does an entire real user journey work, start to finish?"

These are the broadest tests, and the ones closest to how an actual person experiences the app. Instead of testing one small piece in isolation, an end-to-end test drives a real, automated browser through an entire flow, exactly like a person would: click this, type that, check that the right thing appears next.

**Where:** `e2e/tests/*.spec.ts`, using a tool called Playwright.

**Example journeys I test:**
- Landing on the homepage → seeing the main call-to-action → clicking through to sign up
- Signing up with a brand-new email → landing on the dashboard → confirming the project list is genuinely empty (not secretly pre-filled)
- Entering Demo Mode → seeing the required "nothing is saved" warning before continuing → confirming the demo badge is visible afterward
- Toggling between light and dark mode and confirming the whole page actually changes

**Run them yourself:**
```bash
npm run test:e2e
```

---

## Why all of this runs automatically (CI/CD)

Writing tests only helps if they actually get run. I set up a pipeline (see `.github/workflows/ci.yml`) so that every single time code is pushed or a change is proposed, a computer automatically:

1. Scans for accidentally-committed secrets (passwords, API keys)
2. Type-checks and lints the code (catches obvious mistakes before they're even run)
3. Runs every unit test
4. Runs the backend's tests against a real, temporary database
5. Runs the full end-to-end browser test suite
6. Scans every dependency for known security problems
7. Builds the whole project, to confirm it genuinely compiles

If any of these fail, that's visible immediately — nobody has to remember to run checks manually, and a broken change is caught before it ever reaches real users. This is sometimes called a "quality gate": a change simply cannot get in unless it passes.

---

## What I deliberately did *not* claim

I want to be honest about scope here, the same way I was in `SECURITY.md`. I did not set up things like SonarQube, paid dependency-monitoring services (e.g. Dependabot/Snyk dashboards), or a production error-tracking service (e.g. Sentry) — those are genuinely valuable in a real company setting, but they need external accounts and ongoing infrastructure that go beyond what a single portfolio project reasonably needs. What I *did* build is the underlying discipline those tools are meant to support: real automated tests, a real CI pipeline that blocks bad changes, real dependency scanning, and real secret scanning — the actual practice, not just the branding of it.

---

<sub>Sandra Valerie</sub>
