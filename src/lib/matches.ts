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

/** Split matches into upcoming (not locked) and completed/locked sets. */
export function partitionMatches(matches: Match[], now: Date = new Date()) {
  const upcoming: Match[] = [];
  const completed: Match[] = [];
  for (const m of matches) {
    if (new Date(m.kickoff).getTime() > now.getTime()) upcoming.push(m);
    else completed.push(m);
  }
  return { upcoming, completed };
}

/** Format a kickoff time for display, e.g. "18:00". */
export function formatKickoffTime(kickoff: string): string {
  return format(new Date(kickoff), "HH:mm");
}
