# What is BuildAI, actually? (No coding knowledge required)

Hi — I'm Sandra Valerie. I built BuildAI, and this document is my attempt to explain what it is and why I made the decisions I made, without assuming you know how to code. If a technical word shows up, I'll explain it the first time I use it.

## The basic idea

Imagine you want a simple app for your small business — say, something to track your inventory, or manage your customer relationships. Normally, you'd either need to hire a developer, or learn to code yourself. BuildAI is my attempt at a shortcut: you type what you want in plain English, like "build me a dashboard to track my team," and the app turns that sentence into a real, working piece of software — one you can then keep adjusting just by describing what you want changed, the same way you'd ask a person to make an edit.

This idea already exists as a category of product (you might have heard of similar tools). What's mine here is the specific design, the visual identity, the exact feature set, and — importantly for a learning project — every line of code behind it.

## Why I built it this way

**I chose to generate a *structured plan* first, not just a blob of code.** When you type a request, the AI doesn't just spit out one giant file. It first works out a plan — what pages the app needs, what smaller reusable pieces ("components") those pages are built from, and what kind of information the app needs to keep track of. Only after that plan is checked over does the AI actually write the files. I did it this way because it's much more reliable: it's the difference between asking someone to "just start typing" versus asking them to sketch an outline first. The outline catches problems early.

**I chose to let people keep talking to their project, not just create it once.** After the initial version exists, you can say things like "make it darker" or "add a chart," and the AI understands what already exists and adjusts it, rather than starting over. This felt closer to how people actually work with a real developer — through an ongoing conversation, not a single one-shot request.

**I chose to give people a real, visible workspace — not a black box.** A lot of "type a sentence, get an app" products hide all the actual code from you. I decided BuildAI should show you the real files being created, in a proper code-editor view, side-by-side with a live preview of what the app looks like. Even if you don't personally read code, being able to *see* that real, organized files exist — rather than some invisible magic — was important to me. It's the difference between a black box and something you can actually inspect.

**I chose to remember every meaningful change, not just the current state.** Every significant edit becomes a labeled "version" you can look back at or restore — similar to how a word processor might let you see and revert to an earlier draft. Mistakes and experiments shouldn't be scary if you can always step back.

**I chose to make templates a starting point, not a locked-in choice.** You can pick a ready-made template (say, a template built for a legal practice, or a healthcare clinic), customize it however you like using the same AI conversation, and only decide to actually keep it — under a name you choose — once you're happy with it. Nothing is permanently saved to your account until you say so.

**I chose to build a "Demo Mode."** Not everyone wants to create an account just to see what a product does. Demo Mode lets anyone explore the entire app immediately, with realistic example projects already loaded, and I made sure it's completely honest about what it is: there's a clear warning that nothing built in Demo Mode is saved, so nobody gets a false impression that their work is being kept.

## Why I spent real effort on testing and security, not just features

A lot of student and portfolio projects stop at "does it look like it works when I click around it." I didn't want to stop there, for a simple reason: a product that manages people's own work (their projects, their files) has a real responsibility to actually protect that work — to make sure one person can never accidentally see or edit somebody else's project, for example. So alongside the visible features, I built:

- **Automated tests** that a computer re-runs on every single change, checking both small individual pieces of logic and entire real user journeys (see `TESTING.md` for the plain-language breakdown).
- **Real security protections** — like making sure the server itself double-checks who owns a project before allowing changes to it, not just trusting whatever the app's interface happens to show or hide (see `SECURITY.md`).
- **An automatic pipeline** that runs all of this — the tests, security scans, and a check for accidentally-leaked passwords or keys — every time code changes, so problems get caught immediately instead of relying on me remembering to check by hand.

I think of this the same way I'd think about any real product: the visible features are what people notice first, but the invisible engineering underneath is what makes it trustworthy enough to actually use.

## What's real vs. what's a deliberate simplification

I want to be upfront about this, the same way I'd want a real product's documentation to be honest with me.

- **The interface, the design, the workspace, the account system, and the overall product experience are all fully real and fully working**, and can run entirely on their own.
- **The AI generation and the backend server are built as real, production-shaped code** — a proper structured backend (see `apps/api`) with a real database design, real security checks, and a real connection point for an actual AI provider (Groq) — but they need someone to plug in their own account credentials (a Firebase project, a Groq account, a database) to run against real, live data. Without those, the front end runs in a built-in "demo mode" that behaves the same way but keeps everything in the browser's memory instead of a real database, specifically so the whole product is explorable immediately with zero setup.
- **The live preview shows a realistic, safe representation of what a generated app would look like**, rather than actually executing arbitrary AI-generated code live in the browser. I explain exactly why in `SECURITY.md` — in short, safely running someone else's (or an AI's) code in real time is its own serious engineering project on its own, and I chose to be honest about that scope rather than fake it.

---

<sub>Sandra Valerie</sub>
