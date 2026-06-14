/** Firestore collection / document path constants. */
export const COLLECTIONS = {
  users: "users",
  matches: "matches",
  predictions: "predictions",
  meta: "meta",
} as const;

export const META_DOCS = {
  sync: "sync",
} as const;

/** Deterministic prediction document id so each user has one pick per match. */
export function predictionId(userId: string, matchId: string): string {
  return `${userId}_${matchId}`;
}

/** Points awarded for a correct match prediction. */
export const POINTS_PER_CORRECT = 1;

/**
 * Candidate champion teams shown in the picker.
 *
 * The official 48-team field isn't fully known until the draw, so this list is
 * a curated set of likely contenders. Admins can extend it freely — a champion
 * pick is just a stored team name, not a foreign key.
 */
export const CHAMPION_TEAMS: { name: string; flag: string }[] = [
  { name: "Argentina", flag: "🇦🇷" },
  { name: "Brazil", flag: "🇧🇷" },
  { name: "France", flag: "🇫🇷" },
  { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "Spain", flag: "🇪🇸" },
  { name: "Germany", flag: "🇩🇪" },
  { name: "Portugal", flag: "🇵🇹" },
  { name: "Netherlands", flag: "🇳🇱" },
  { name: "Belgium", flag: "🇧🇪" },
  { name: "Italy", flag: "🇮🇹" },
  { name: "Croatia", flag: "🇭🇷" },
  { name: "Uruguay", flag: "🇺🇾" },
  { name: "Mexico", flag: "🇲🇽" },
  { name: "USA", flag: "🇺🇸" },
  { name: "Canada", flag: "🇨🇦" },
  { name: "Japan", flag: "🇯🇵" },
  { name: "Korea Republic", flag: "🇰🇷" },
  { name: "Morocco", flag: "🇲🇦" },
  { name: "Senegal", flag: "🇸🇳" },
  { name: "Colombia", flag: "🇨🇴" },
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
