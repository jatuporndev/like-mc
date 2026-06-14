import { format, isThisYear, isToday, isTomorrow, isYesterday } from "date-fns";

import type { Match } from "@/types";

/**
 * A day label that the UI can localize. Relative days carry an i18n `key`;
 * absolute dates are pre-formatted in `text` (and have a null key).
 */
export interface DayLabel {
  key: "day.today" | "day.tomorrow" | "day.yesterday" | null;
  text: string;
}

export interface MatchDayGroup {
  /** Stable key (yyyy-MM-dd in local time). */
  key: string;
  /** Localizable day label: Today / Tomorrow / Jun 18. */
  label: DayLabel;
  /** Earliest kickoff in the group, for sorting. */
  date: Date;
  matches: Match[];
}

/**
 * Build a friendly day label for a kickoff date.
 *   Today · Tomorrow · Yesterday · "Jun 18" · "Jun 18, 2027"
 */
export function formatMatchDayLabel(date: Date): DayLabel {
  if (isToday(date)) return { key: "day.today", text: "Today" };
  if (isTomorrow(date)) return { key: "day.tomorrow", text: "Tomorrow" };
  if (isYesterday(date)) return { key: "day.yesterday", text: "Yesterday" };
  const text = isThisYear(date)
    ? format(date, "MMM d")
    : format(date, "MMM d, yyyy");
  return { key: null, text };
}

/** Local-time yyyy-MM-dd key, used to bucket matches into a single day. */
function dayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Group matches into day buckets, sorted ascending by kickoff. Matches within a
 * day are also sorted ascending. Soonest matches/days appear first.
 */
export function groupMatchesByDate(matches: Match[]): MatchDayGroup[] {
  const buckets = new Map<string, MatchDayGroup>();

  const sorted = [...matches].sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
  );

  for (const match of sorted) {
    const date = new Date(match.kickoff);
    const key = dayKey(date);
    const existing = buckets.get(key);
    if (existing) {
      existing.matches.push(match);
    } else {
      // Anchor the group at midnight of that local day for a clean label/sort.
      const anchor = new Date(date);
      anchor.setHours(0, 0, 0, 0);
      buckets.set(key, {
        key,
        label: formatMatchDayLabel(anchor),
        date: anchor,
        matches: [match],
      });
    }
  }

  return [...buckets.values()].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
}

/** A match that has kicked off but isn't finished yet (in progress). */
export function isMatchLive(
  match: Pick<Match, "status" | "winner" | "kickoff">,
  now: Date = new Date()
): boolean {
  if (isMatchFinished(match)) return false;
  if (match.status === "IN_PLAY" || match.status === "PAUSED") return true;
  // Status can be stale between syncs: a match past kickoff that isn't finished
  // is still in progress as far as the UI is concerned.
  return new Date(match.kickoff).getTime() <= now.getTime();
}

/** A match is finished once it's reported FINISHED or has a decided result. */
export function isMatchFinished(
  match: Pick<Match, "status" | "winner">
): boolean {
  return match.status === "FINISHED" || match.winner !== null;
}

/**
 * Split matches into the upcoming (first) tab and the completed tab.
 *
 * The Completed tab holds **only finished** matches. Everything else — not yet
 * started *and* currently in progress — stays in the first tab, so a live game
 * shows up under "Today" alongside the day's other fixtures instead of being
 * buried in Completed.
 */
export function partitionMatches(matches: Match[]) {
  const upcoming: Match[] = [];
  const completed: Match[] = [];
  for (const m of matches) {
    if (isMatchFinished(m)) completed.push(m);
    else upcoming.push(m);
  }
  return { upcoming, completed };
}

/** Format a kickoff time for display, e.g. "18:00". */
export function formatKickoffTime(kickoff: string): string {
  return format(new Date(kickoff), "HH:mm");
}
