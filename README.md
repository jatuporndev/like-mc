# ⚽ WC 2026 Predictor

A private **FIFA World Cup 2026** prediction game for a small group of friends.
Sign in with Google, predict the winner of every match, pick your champion, and
climb the leaderboard.

Built to be simple, maintainable, and **not realtime** — match data is synced
periodically from [football-data.org](https://www.football-data.org/) into
Firestore. No websockets, no live scores.

## ✨ Features

- 🔐 Google sign-in (Firebase Auth), auto-provisioned user profiles
- 🎯 Match predictions (Home / Draw / Away) — editable until kickoff, then locked
- 🏆 One **permanent** champion pick with a sticky banner on every page
- 📊 Leaderboard (1 point per correct match)
- 🛠️ Admin panel: sync matches, manual match edit, recalculate points, sync log
- 🤖 Machine-to-machine sync endpoint for Google Apps Script / cron
- 🌙 Dark mode, mobile-first UI, skeleton loaders, empty states, toasts

## 🧱 Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui-style components ·
Firebase Auth + Firestore + Admin SDK · TanStack Query · Zod · date-fns · Lucide.

## 📁 Project structure

```
src/
  app/
    page.tsx                 # public landing + leaderboard preview
    dashboard/               # matches grouped by day + leaderboard
    leaderboard/             # full leaderboard
    admin/                   # admin tools (whitelisted emails)
    api/
      me/                    # upsert + fetch own profile
      predictions/           # create/update a match prediction
      champion-pick/         # set champion (once)
      admin/sync-matches/    # sync from football-data (+ bearer secret)
      admin/recalculate-points/
      admin/match/           # manual match edit
      admin/champion/        # admin champion override
  components/                # UI primitives + feature components
  hooks/                     # auth + data hooks (React Query)
  lib/                       # firebase clients, football api, scoring, utils
  server/                    # server-only: auth guards, sync logic
  types/                     # shared domain types
scripts/
  seed.ts                    # first-deploy sync trigger
  apps-script.gs             # Google Apps Script scheduler
firestore.rules              # read-only client access; writes via Admin SDK
```

## 🚀 Getting started

### 1. Install

```bash
npm install
```

### 2. Firebase setup

1. Create a project at <https://console.firebase.google.com>.
2. **Authentication → Sign-in method →** enable **Google**.
3. **Firestore Database →** create a database (production mode).
4. **Project settings → General → Your apps →** add a **Web app** and copy the
   config into the `NEXT_PUBLIC_FIREBASE_*` env vars.
5. **Project settings → Service accounts → Generate new private key.** Use the
   JSON's `project_id`, `client_email`, and `private_key` for the
   `FIREBASE_*` (Admin) env vars.

### 3. football-data.org token

Register a free account at <https://www.football-data.org/client/register> and
copy your API token into `FOOTBALL_DATA_API_TOKEN`.

> The free tier covers the World Cup competition (`WC`). The frontend never
> calls football-data.org directly — only the server-side sync route does.

### 4. Environment variables

```bash
cp .env.local.example .env.local
# then fill in every value
```

| Variable | Where it's used |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_*` | Browser Firebase client (Auth + reads) |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | Admin SDK (server) |
| `FOOTBALL_DATA_API_TOKEN` | Server-side match sync |
| `ADMIN_EMAILS` | Server-side admin authorization |
| `NEXT_PUBLIC_ADMIN_EMAILS` | Client UI (shows Admin link) — server always re-checks |
| `SYNC_SECRET` | Bearer token for Apps Script / cron sync |

> Paste the Admin private key on one line with literal `\n` for newlines, e.g.
> `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`

### 5. Deploy Firestore rules

```bash
npm i -g firebase-tools
firebase login
firebase use --add           # select your project
firebase deploy --only firestore:rules
```

### 6. Run

```bash
npm run dev
# open http://localhost:3000
```

### 7. Seed match data

With the dev server (or a deployment) running, trigger the first sync:

```bash
npm run seed                              # targets http://localhost:3000
SEED_TARGET_URL=https://your-app npm run seed
```

You can also click **Sync World Cup Matches** in the Admin panel.

## 🔁 Scheduled sync (no realtime)

Match results are pulled on a schedule, 2–4× per day. Use the included Google
Apps Script (`scripts/apps-script.gs`) — it POSTs to `/api/admin/sync-matches`
with `Authorization: Bearer <SYNC_SECRET>` at 01:00 / 07:00 / 13:00 / 19:00.

Any cron runner works just as well:

```bash
curl -X POST https://your-app/api/admin/sync-matches \
  -H "Authorization: Bearer $SYNC_SECRET"
```

## 🔒 Security model

- **All writes go through authenticated API routes** using the Firebase Admin
  SDK, which enforces the business rules in one place:
  - predictions are rejected after kickoff (locked),
  - a champion pick can only be set once (admin override aside),
  - points/winners/scores are never client-writable.
- `firestore.rules` therefore grants the client **read-only** access and denies
  all direct writes.
- Admin routes require a whitelisted email (verified Firebase ID token); the
  sync route additionally accepts the `SYNC_SECRET` bearer token for automation.

## ☁️ Deployment (Vercel)

1. Push to GitHub and import the repo in Vercel.
2. Add every variable from `.env.local` to the Vercel project (Production).
3. Add your Vercel domain to **Firebase Auth → Settings → Authorized domains**.
4. Deploy, then run the seed step (or click Sync in Admin).
5. Point the Apps Script `APP_URL` at your Vercel URL.

## 📜 Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run typecheck` | TypeScript type-check |
| `npm run lint` | ESLint |
| `npm run seed` | Trigger the first match sync |

## 📝 Scoring

- Correct match prediction → **+1 point**. Wrong → 0. Draw predictions count.
- Champion picks are stored now and may award bonus points later (left as a
  deliberate, easy extension — adjust `calculateUserPoints` in `lib/scoring.ts`).
