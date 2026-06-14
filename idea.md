You are a senior full-stack engineer.

Build a complete production-ready web application for a private FIFA World Cup 2026 prediction game for a small group of friends (3–5 users).

The project must prioritize simplicity, maintainability, clean architecture, and a great UX.

Tech stack:

* Next.js 15 (App Router)
* TypeScript
* Tailwind CSS
* shadcn/ui
* Firebase Authentication
* Firebase Firestore
* Firebase Admin SDK (server-side)
* React Query (TanStack Query)
* Zod
* date-fns
* Lucide React

Deployment target:

* Vercel or Firebase Hosting

Core concept:
Users log in with Google and predict:

1. Winner of each FIFA World Cup 2026 match
2. Champion of the entire FIFA World Cup 2026

The app is NOT realtime.
No websockets.
No live score system.

Football data comes from football-data.org and is synced periodically into Firestore.

Use this endpoint:

https://api.football-data.org/v4/competitions/WC/matches

Frontend must NEVER call football-data.org directly.

All football API access must remain server-side only.

---

## AUTHENTICATION

Implement Firebase Authentication:

* Google Login only
* Protected routes
* Auto create/update Firestore user profile after login

Collection: users

Document id = Firebase UID

Fields:

uid
displayName
email
photoURL
points
championPick
championPickedAt
createdAt
updatedAt

championPick must only be selectable ONCE.

After user selects champion:

* User cannot edit it
* UI becomes locked
* Only admin can change it later

---

## WORLD CUP CHAMPION FEATURE

Users must predict who will win the entire World Cup.

Behavior:

If championPick is empty:
Show mandatory modal on dashboard.

Example UX:

"🏆 Pick Your World Cup Champion"

User selects exactly one national team.

Example:
Brazil
France
Argentina
Japan
Germany

User confirms selection.

After confirmation:
Champion pick becomes PERMANENT.

Cannot be edited by users.

After selection:
Always show sticky top banner on every authenticated page.

Example:

🏆 YOUR CHAMPION PICK
🇧🇷 Brazil

Sticky behavior:

* position sticky
* always visible at top
* mobile friendly

Later admin may change it manually.

Champion prediction may award bonus points later.

---

## MATCH PREDICTIONS

Users predict each match.

Choices:

* Home team win
* Draw
* Away team win

Rules:

* One prediction per match
* Editable before kickoff
* Automatically locked after kickoff
* No prediction after kickoff

Scoring:

Correct prediction:
+1 point

Wrong prediction:
0 points

Draw predictions must work.

---

## MATCH DATA

Fetch all World Cup matches from football-data.org.

Save into Firestore.

Collection: matches

Document id = football-data match id (string)

Fields:

matchId
homeTeam
awayTeam
homeTeamShort
awayTeamShort
homeCrest
awayCrest
kickoff
stage
group
status
homeScore
awayScore
winner
locked
updatedAt

Winner values:

HOME_TEAM
DRAW
AWAY_TEAM

locked logic:

kickoff < current_time

---

## PREDICTIONS COLLECTION

Collection: predictions

Fields:

userId
matchId
pickedTeam
createdAt
updatedAt

pickedTeam values:

HOME_TEAM
DRAW
AWAY_TEAM

Only owner can edit.

---

## UI / UX REQUIREMENTS

Modern sports UI.

Mobile-first responsive.

Dark mode support.

Fast loading.

Skeleton loading.

Empty states.

Toast notifications.

Good typography.

Use football/sports inspired styling.

---

## LANDING PAGE

Public page.

Contains:

* App title
* Description
* Google Login button
* Small leaderboard preview
* Hero section

---

## DASHBOARD PAGE

Authenticated page.

Must show:

1. Sticky Champion Banner (always top)

2. Upcoming matches

3. Completed matches

4. User predictions

5. Leaderboard preview

Matches must be grouped by DAY.

IMPORTANT:

Do NOT show one giant match list.

Group matches into sections by date.

Example:

🔥 Today

Germany vs Japan

Brazil vs Morocco

Tomorrow

France vs Senegal

Argentina vs Algeria

Jun 18

Mexico vs Korea

Sort matches ascending by kickoff time.

Closest upcoming matches appear first.

Completed matches section should be separate.

Date formatting:

Show:

* Today
* Tomorrow
* Otherwise formatted date

Each match card shows:

* team names
* team crest
* kickoff time
* prediction buttons

Buttons:

[Home Team]
[Draw]
[Away Team]

Disable buttons after kickoff.

Show prediction state.

Show result state after match ends.

Example:

✅ Correct prediction

❌ Wrong prediction

---

## LEADERBOARD PAGE

Rank users by total points.

Display:

* ranking
* profile image
* display name
* points
* champion pick

---

## ADMIN PAGE

Admin page exists.

Protect using email whitelist.

Admin features:

1. Sync Matches

Button:

[ Sync World Cup Matches ]

Calls football-data API.

Upsert Firestore matches.

2. Manual Match Edit

Edit:

winner
score
status

3. Recalculate Points

Button:

[ Recalculate Scores ]

Recompute all users points.

4. Sync Logs

Display latest sync time.

Admin UI can be simple.

---

## API ROUTES

Implement secure server-side API routes.

POST /api/admin/sync-matches

Purpose:

* Fetch World Cup matches
* Save/update Firestore
* Update scores
* Update winners
* Update locked state

POST /api/admin/recalculate-points

Purpose:

* Recompute leaderboard

POST /api/champion-pick

Purpose:

* Save champion prediction

Rule:
Cannot update if already selected.

POST /api/predictions

Purpose:

* Create/update match prediction

Rule:
Only before kickoff.

---

## GOOGLE APPS SCRIPT SUPPORT

Design API architecture so Google Apps Script can trigger sync.

Expected schedule:
2–4 times daily.

Example:
01:00
07:00
13:00
19:00

Apps Script should be able to call:

/api/admin/sync-matches

with Bearer secret token.

---

## SECURITY

Implement Firestore security rules.

Requirements:

* Auth required
* Users can only edit their own predictions
* Users cannot modify scores
* Users cannot modify winners
* Users cannot modify championPick after first selection
* Admin only routes protected
* API secret validation

---

## UTILITIES

Create reusable utilities:

syncMatchesFromFootballAPI()

calculatePredictionResult()

calculateLeaderboard()

lockPrediction()

groupMatchesByDate()

formatMatchDayLabel()

---

## DEVELOPER EXPERIENCE

Provide:

* clean folder structure
* reusable hooks
* TypeScript types
* environment variables setup
* Firebase setup instructions
* README
* first deploy seed command
* deployment instructions

Generate production-quality code only.

No pseudocode.

Use clean architecture and best practices.
