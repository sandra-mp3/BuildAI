# Going live — hosting BuildAI for free

Hi, it's Sandra Valerie. This is the step-by-step process I use to take BuildAI from "running on my own laptop" to "a real website anyone can visit," using only free tools. No credit card required anywhere in this guide.

## The plan, in one paragraph

BuildAI is actually already two separate apps living in one folder: `apps/web` (the website itself) and `apps/api` (the backend server that talks to the database, Groq, Stripe, and M-Pesa). "Hosting" just means finding a permanent internet address for each of those two things, instead of `localhost`. I use **Vercel** for the website (it's built specifically for Next.js, which is what `apps/web` is) and **Render** for the backend server (a free option for running a real, always-on-ish Node.js server). The database (Supabase) and the login system (Firebase) are already hosted on the internet — nothing to do there, they just need to be told about the new addresses once everything else is live.

Here's the order I do things in, and why: backend first, then frontend (since the frontend needs to know the backend's address), then go back and connect them properly.

---

## Step 1 — Put the code on GitHub

Both Vercel and Render deploy by connecting to a GitHub repository, so this comes first.

1. Create a new, empty repository at [github.com/new](https://github.com/new). Don't initialize it with a README — this project already has one.
2. From inside the unzipped `BuildAI` folder, run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
   git push -u origin main
   ```
3. **Before you push, double check your secrets aren't included.** Run `git status` first — you should *not* see `apps/api/.env` or `apps/web/.env.local` listed as files to be committed (the `.gitignore` in this project already excludes them). If you ever see them listed, stop and don't push until that's sorted out.

---

## Step 2 — Deploy the backend (`apps/api`) to Render

1. Sign up at [render.com](https://render.com) (free, no card needed for this tier).
2. Click **New +** → **Web Service**, and connect the GitHub repository from Step 1.
3. Render will ask for some settings — fill them in exactly like this:
   - **Root Directory:** `apps/api`
   - **Runtime:** Node
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `node dist/main`
   - **Instance Type:** Free
4. Before clicking "Create," add every environment variable from your local `apps/api/.env` file, one at a time, under the "Environment" section. Copy the exact same key names and values you already have locally — `DATABASE_URL`, `DIRECT_URL`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `GROQ_API_KEY`, `GROQ_MODEL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `MPESA_*`. Leave `MPESA_CALLBACK_URL` and `WEB_ORIGIN` for a moment — you'll fill those in properly in Step 5, once you know the real addresses.
   - One thing to watch for: when pasting `FIREBASE_PRIVATE_KEY`, paste it exactly as it appears in your `.env` file, `\n` characters and surrounding quotes included.
5. Click **Create Web Service**. Render will build and start it — this takes a few minutes the first time.
6. Once it's live, Render gives you a real address, something like `https://buildai-api.onrender.com`. **Write this down** — you need it in Step 4.

---

## Step 3 — Make sure the database actually has its tables

If you haven't already run this against your real Supabase database, do it now, from your own computer (not Render — this is a one-time setup command, not something that needs to run on the server):

```bash
cd apps/api
npx prisma migrate deploy
```

This is very likely the single most common reason things "don't work" — without this, the database has no tables at all, and every save silently fails.

---

## Step 4 — Deploy the frontend (`apps/web`) to Vercel

1. Sign up at [vercel.com](https://vercel.com) (free).
2. Click **Add New** → **Project**, and import the same GitHub repository.
3. Vercel usually auto-detects Next.js. Set:
   - **Root Directory:** `apps/web`
   - Framework Preset: Next.js (should be automatic)
4. Add environment variables — copy these from your local `apps/web/.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_API_URL` — set this to the Render address from Step 2 (e.g. `https://buildai-api.onrender.com`), **not** `localhost:4000`.
5. Click **Deploy**. Vercel gives you a real address too, like `https://buildai.vercel.app`.

---

## Step 5 — Go back and connect everything properly

This is the step people usually forget, and it's why "it worked locally but not when I deployed it" happens so often — a few other services need to be told about the new, real addresses.

1. **Render → your backend service → Environment:**
   - Set `WEB_ORIGIN` to your real Vercel address (e.g. `https://buildai.vercel.app`). Without this, the backend will reject every request from your live site as an unrecognized origin (CORS).
   - Set `MPESA_CALLBACK_URL` to `https://YOUR-RENDER-ADDRESS/billing/webhooks/mpesa`.
   - Save — Render will automatically redeploy with the new values.
2. **Firebase Console → Authentication → Settings → Authorized domains:** add your Vercel domain (e.g. `buildai.vercel.app`). Without this, Firebase will silently refuse to sign anyone in from your live site — it only trusts domains you've explicitly listed here.
3. **Stripe Dashboard → Developers → Webhooks:** open the webhook endpoint you already created, and edit its URL from the old `loca.lt` tunnel address to `https://YOUR-RENDER-ADDRESS/billing/stripe/webhook`. You can keep the same webhook (same signing secret) — just update the URL field.
4. You can now stop running your local tunnel (`lt --port 4000`) entirely — Render is your permanent public backend address now.

---

## Step 6 — Verify it's actually live

- Visit your real Vercel URL and sign up with a real email.
- Create a project with your own custom prompt (not one of the suggested examples) and confirm it doesn't show the "can't reach the backend" message.
- Log out and log back in — your project should still be there now (this was the exact bug fixed earlier).
- Try a Stripe test checkout (use Stripe's test card number `4242 4242 4242 4242`, any future expiry, any CVC).

Your GitHub repository's **Actions** tab will also start automatically running the test suite and security scans (`.github/workflows/ci.yml`) on every future push — nothing extra to set up for that, it's already part of this project.

---

## Being honest about the free-tier limits

- **Render's free tier "sleeps"** after about 15 minutes with no traffic, and takes 30–60 seconds to wake back up on the next request. Stripe automatically retries a webhook if it doesn't get an immediate response, so this is usually fine for Stripe. It's a bigger risk for M-Pesa, whose retry behavior is less forgiving — if this becomes a real problem, the usual fix is a paid "always-on" tier, which is a cost decision, not a hosting-complexity one.
- **Supabase's free tier pauses a project after about a week of no activity.** If your live site suddenly can't reach the database after a quiet week, check the Supabase dashboard — there's usually just a one-click "restore" button.
- **None of this makes payments "real."** Going live on the internet is a hosting question. Accepting real money is a separate, business-level process: Stripe requires activating your account for live mode (identity/business verification), and M-Pesa requires Safaricom's own go-live approval for a real PayBill/Till number. Both are free to *apply* for, but they're approval processes, not hosting steps — see `SECURITY.md` and the M-Pesa note in the billing checkout dialog for more on this distinction.

---

<sub>Sandra Valerie</sub>
