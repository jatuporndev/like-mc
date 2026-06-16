/** Firestore collection / document path constants. */
export const COLLECTIONS = {
  users: "users",
  matches: "matches",
  predictions: "predictions",
  meta: "meta",
} as const;

export const META_DOCS = {
  sync: "sync",
  scorers: "scorers",
  standings: "standings",
  picks: "picks",
} as const;

/** Deterministic prediction document id so each user has one pick per match. */
export function predictionId(userId: string, matchId: string): string {
  return `${userId}_${matchId}`;
}

/** Points awarded for a correct match prediction. */
export const POINTS_PER_CORRECT = 1;

/**
 * Bonus points awarded for how far a user's champion pick advanced. Tiered:
 * the furthest round the picked team reaches decides the bonus, so a pick that
 * wins the trophy earns `WINNER` (not WINNER + every lower tier). A losing
 * finalist earns `FINAL`, a beaten semi-finalist `SEMI_FINAL`, and so on.
 */
export const CHAMPION_BONUS = {
  WINNER: 10,
  FINAL: 5,
  SEMI_FINAL: 3,
  QUARTER_FINAL: 1,
} as const;

/**
 * football-data.org knockout `stage` values, ranked by how deep they are. Used
 * to find the furthest round a team reached. `GROUP_STAGE` and
 * `THIRD_PLACE` are intentionally excluded — a third-place play-off team is
 * already credited for reaching the semi-final via its SEMI_FINALS match.
 */
export const KNOCKOUT_STAGE_RANK: Record<string, number> = {
  LAST_16: 1,
  QUARTER_FINALS: 2,
  SEMI_FINALS: 3,
  FINAL: 4,
} as const;

/**
 * Candidate champion teams shown in the picker.
 *
 * The official 48-team field isn't fully known until the draw, so this is a
 * broad list of FIFA national teams (every realistic contender plus the wider
 * field). The picker has a local search box, so a long list is fine. Admins can
 * extend it freely — a champion pick is just a stored team name, not a foreign
 * key.
 */
export const CHAMPION_TEAMS: { name: string; flag: string }[] = [
  // --- UEFA (Europe) ---
  { name: "France", flag: "🇫🇷" },
  { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "Spain", flag: "🇪🇸" },
  { name: "Germany", flag: "🇩🇪" },
  { name: "Portugal", flag: "🇵🇹" },
  { name: "Netherlands", flag: "🇳🇱" },
  { name: "Belgium", flag: "🇧🇪" },
  { name: "Italy", flag: "🇮🇹" },
  { name: "Croatia", flag: "🇭🇷" },
  { name: "Denmark", flag: "🇩🇰" },
  { name: "Switzerland", flag: "🇨🇭" },
  { name: "Austria", flag: "🇦🇹" },
  { name: "Poland", flag: "🇵🇱" },
  { name: "Ukraine", flag: "🇺🇦" },
  { name: "Sweden", flag: "🇸🇪" },
  { name: "Serbia", flag: "🇷🇸" },
  { name: "Turkey", flag: "🇹🇷" },
  { name: "Norway", flag: "🇳🇴" },
  { name: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { name: "Wales", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  { name: "Czechia", flag: "🇨🇿" },
  { name: "Hungary", flag: "🇭🇺" },
  { name: "Romania", flag: "🇷🇴" },
  { name: "Greece", flag: "🇬🇷" },
  { name: "Slovenia", flag: "🇸🇮" },
  { name: "Slovakia", flag: "🇸🇰" },
  { name: "Republic of Ireland", flag: "🇮🇪" },
  { name: "Iceland", flag: "🇮🇸" },
  { name: "Finland", flag: "🇫🇮" },
  { name: "Albania", flag: "🇦🇱" },
  { name: "Bosnia and Herzegovina", flag: "🇧🇦" },
  { name: "North Macedonia", flag: "🇲🇰" },
  { name: "Georgia", flag: "🇬🇪" },

  // --- CONMEBOL (South America) ---
  { name: "Argentina", flag: "🇦🇷" },
  { name: "Brazil", flag: "🇧🇷" },
  { name: "Uruguay", flag: "🇺🇾" },
  { name: "Colombia", flag: "🇨🇴" },
  { name: "Ecuador", flag: "🇪🇨" },
  { name: "Peru", flag: "🇵🇪" },
  { name: "Chile", flag: "🇨🇱" },
  { name: "Paraguay", flag: "🇵🇾" },
  { name: "Venezuela", flag: "🇻🇪" },
  { name: "Bolivia", flag: "🇧🇴" },

  // --- CONCACAF (North/Central America & Caribbean) ---
  { name: "USA", flag: "🇺🇸" },
  { name: "Mexico", flag: "🇲🇽" },
  { name: "Canada", flag: "🇨🇦" },
  { name: "Costa Rica", flag: "🇨🇷" },
  { name: "Panama", flag: "🇵🇦" },
  { name: "Jamaica", flag: "🇯🇲" },
  { name: "Honduras", flag: "🇭🇳" },
  { name: "El Salvador", flag: "🇸🇻" },
  { name: "Guatemala", flag: "🇬🇹" },

  // --- CAF (Africa) ---
  { name: "Morocco", flag: "🇲🇦" },
  { name: "Senegal", flag: "🇸🇳" },
  { name: "Nigeria", flag: "🇳🇬" },
  { name: "Egypt", flag: "🇪🇬" },
  { name: "Algeria", flag: "🇩🇿" },
  { name: "Tunisia", flag: "🇹🇳" },
  { name: "Ghana", flag: "🇬🇭" },
  { name: "Ivory Coast", flag: "🇨🇮" },
  { name: "Cameroon", flag: "🇨🇲" },
  { name: "Mali", flag: "🇲🇱" },
  { name: "South Africa", flag: "🇿🇦" },
  { name: "Cape Verde", flag: "🇨🇻" },
  { name: "Burkina Faso", flag: "🇧🇫" },
  { name: "DR Congo", flag: "🇨🇩" },

  // --- AFC (Asia) ---
  { name: "Japan", flag: "🇯🇵" },
  { name: "Korea Republic", flag: "🇰🇷" },
  { name: "Iran", flag: "🇮🇷" },
  { name: "Australia", flag: "🇦🇺" },
  { name: "Saudi Arabia", flag: "🇸🇦" },
  { name: "Qatar", flag: "🇶🇦" },
  { name: "Iraq", flag: "🇮🇶" },
  { name: "United Arab Emirates", flag: "🇦🇪" },
  { name: "Uzbekistan", flag: "🇺🇿" },
  { name: "Jordan", flag: "🇯🇴" },
  { name: "China PR", flag: "🇨🇳" },

  // --- OFC (Oceania) ---
  { name: "New Zealand", flag: "🇳🇿" },
];

/** Find a flag emoji for a team name, falling back to a trophy. */
export function flagForTeam(name: string | null): string {
  if (!name) return "🏆";
  return CHAMPION_TEAMS.find((t) => t.name === name)?.flag ?? "🏳️";
}

/** Parse the admin email allowlist from an env string. */
export function parseAdminEmails(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Client-visible admin emails (used only to toggle UI; server re-checks). */
export const ADMIN_EMAILS = parseAdminEmails(
  process.env.NEXT_PUBLIC_ADMIN_EMAILS
);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
