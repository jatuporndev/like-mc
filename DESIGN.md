# Design

Visual system for **WC 2026 Predictor**, captured from the codebase
(`src/app/globals.css`, `tailwind.config.ts`, `src/components/ui/*`). Colors are
HSL channel triplets consumed as `hsl(var(--token))`. The system is
shadcn/ui-style with a pitch-green identity, full light/dark theming, and a
mobile-first layout.

## Theme

Sporty, matchday-energy product UI. Pitch-green primary on a near-white (light)
or deep navy-black (dark) canvas, with generous `0.75rem` rounding and soft
shadows. Crisp, confident, and warm — not corporate, not gambling-loud.

## Color

Tokens are HSL `H S% L%` triplets (used via `hsl(var(--token))`).

### Light

| Token | Value | Role |
| --- | --- | --- |
| `--background` | `0 0% 100%` | Page canvas |
| `--foreground` | `222 47% 11%` | Primary text |
| `--card` / `--popover` | `0 0% 100%` | Surfaces |
| `--primary` | `142 71% 35%` | Pitch green — brand, CTAs, focus ring |
| `--primary-foreground` | `0 0% 100%` | Text on primary |
| `--secondary` / `--muted` / `--accent` | `210 40% 96%` | Subtle fills |
| `--muted-foreground` | `215 16% 47%` | Secondary text |
| `--success` | `142 71% 40%` | Correct prediction / positive |
| `--destructive` | `0 72% 51%` | Errors / wrong / locked-negative |
| `--border` / `--input` | `214 32% 91%` | Hairlines, field borders |
| `--ring` | `142 71% 35%` | Focus ring |

### Dark

| Token | Value | Role |
| --- | --- | --- |
| `--background` | `222 47% 7%` | Page canvas (deep navy-black) |
| `--foreground` | `210 40% 98%` | Primary text |
| `--card` / `--popover` | `222 44% 10%` | Surfaces |
| `--primary` | `142 64% 47%` | Brighter pitch green |
| `--primary-foreground` | `222 47% 7%` | Text on primary |
| `--secondary` / `--muted` / `--accent` | `217 33% 17%` | Subtle fills |
| `--muted-foreground` | `215 20% 65%` | Secondary text |
| `--success` | `142 64% 47%` | Correct prediction / positive |
| `--destructive` | `0 63% 45%` | Errors / wrong |
| `--border` / `--input` | `217 33% 20%` | Hairlines, field borders |
| `--ring` | `142 64% 47%` | Focus ring |

Don't rely on hue alone for prediction state (win / draw / loss, locked) — pair
color with icon or label for accessibility.

## Typography

- **Font:** Inter (`next/font/google`, `--font-sans`, `display: swap`),
  `antialiased`. Family stack prepends **"Twemoji Country Flags"** so team flag
  emoji render on Windows, then falls through to Inter → `system-ui` →
  `sans-serif`.
- **Feature settings:** `"rlig" 1, "calt" 1` (ligatures + contextual alternates).
- **Scale (Tailwind):** body `text-sm` (14px) is the workhorse; `text-xs` for
  badges/meta; `text-base`+ for large buttons and headings.
- **Headings:** `font-semibold leading-none tracking-tight` (see `CardTitle`).
- **Weights:** medium for buttons/interactive, semibold for titles/badges.

## Layout & Spacing

- **Mobile-first**, thumb-reachable primary actions.
- **Container:** centered, `1rem` padding, max width `2xl` = `1280px`.
- **Card padding:** `p-6`; header content spacing `space-y-1.5`.
- **Radius scale:** `--radius: 0.75rem` → `lg = 0.75rem`, `md = lg - 2px`,
  `sm = lg - 4px`. Cards use `rounded-xl`; buttons/inputs `rounded-md`; badges
  and avatars fully `rounded-full`.

## Components

shadcn/ui-style primitives in `src/components/ui` (Radix-backed where
interactive: avatar, dialog, label, slot).

- **Button** (`cva`): variants `default` (primary + `shadow`), `destructive`,
  `outline`, `secondary`, `ghost`, `link`; sizes `default` (h-10), `sm` (h-9),
  `lg` (h-11, text-base), `icon` (10×10). Base: `inline-flex items-center gap-2
  rounded-md text-sm font-medium transition-colors`, focus-visible ring with
  offset, `[&_svg]:size-4`. Icons via Lucide.
- **Card:** `rounded-xl border bg-card shadow-sm`; sub-parts Header / Title /
  Description / Content / Footer.
- **Badge** (`cva`): `rounded-full px-2.5 py-0.5 text-xs font-semibold`; variants
  `default`, `secondary`, `destructive`, `success`, `outline`. Used for
  prediction/result state.
- **Others:** Avatar, Dialog, Skeleton (loading), plus feature components
  (match-card, matches-board, leaderboard, team-crest, navbar, app-shell,
  empty-state, theme-toggle, language-toggle).

## Motion

- `tailwindcss-animate` plugin; accordion keyframes (`0.2s ease-out`).
- Toasts via **sonner**; theming via **next-themes** (class-based dark mode).
- Respect `prefers-reduced-motion`.

## Decorative

- **`.pitch-gradient`** helper: radial pitch-green glow at top
  (`hsl(var(--primary) / 0.18)`) over the background — used for hero/landing
  matchday feel.
- Team **crests** and **country flag emoji** (via `country-flag-emoji-polyfill`)
  are recurring visual motifs.
